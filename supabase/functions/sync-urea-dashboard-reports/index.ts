import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = user.email
    const isAdminEmail = userEmail?.trim().toLowerCase() === 'k.vinayreddy166@gmail.com'
    if (!isAdminEmail) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { syncType = 'auto', fileData = null, fileName = null } = await req.json()

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('external_urea_sync_logs')
      .insert({
        sync_type: syncType,
        status: 'running',
        started_at: new Date().toISOString(),
        created_by: userEmail
      })
      .select()
      .single()

    if (syncLogError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create sync log', details: syncLogError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const syncId = syncLog.id

    try {
      let bookings: any[] = []
      let loginStatus = 'not_attempted'
      let apiStatus = 'not_attempted'
      let httpCode = null
      let recordsFetched = 0
      let recordsInserted = 0
      let recordsUpdated = 0
      let detailedErrorMessage = null

      if (syncType === 'manual_upload' && fileData && fileName) {
        // Parse uploaded file (Excel/CSV)
        bookings = await parseUploadedFile(fileData, fileName)
        loginStatus = 'skipped'
        apiStatus = 'skipped'
        recordsFetched = bookings.length
      } else {
        // Auto sync from external dashboard
        const result = await fetchFromExternalDashboard(syncId)
        bookings = result.bookings
        loginStatus = result.loginStatus
        apiStatus = result.apiStatus
        httpCode = result.httpCode
        recordsFetched = result.recordsFetched
        detailedErrorMessage = result.detailedErrorMessage
      }

      if (bookings.length === 0) {
        await supabase
          .from('external_urea_sync_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            records_imported: 0,
            records_matched: 0,
            records_unmatched: 0,
            records_duplicate: 0,
            login_status: loginStatus,
            api_status: apiStatus,
            http_code: httpCode,
            records_fetched: recordsFetched,
            records_inserted: 0,
            records_updated: 0,
            detailed_error_message: detailedErrorMessage
          })
          .eq('id', syncId)

        return new Response(
          JSON.stringify({
            success: true,
            message: detailedErrorMessage || 'No records found to import',
            syncId,
            recordsImported: 0,
            recordsMatched: 0,
            recordsUnmatched: 0,
            recordsDuplicate: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check for existing bookings to handle updates
      const bookingIds = bookings.map(b => b.booking_id).filter(Boolean)
      let existingBookings: any[] = []
      
      if (bookingIds.length > 0) {
        const { data: existing } = await supabase
          .from('external_urea_bookings')
          .select('id, booking_id')
          .in('booking_id', bookingIds)
        
        existingBookings = existing || []
        recordsUpdated = existingBookings.length
      }

      const existingBookingIds = new Set(existingBookings.map(b => b.booking_id))
      const newBookings = bookings.filter(b => b.booking_id && !existingBookingIds.has(b.booking_id))
      const bookingsToUpdate = bookings.filter(b => b.booking_id && existingBookingIds.has(b.booking_id))

      // Insert new bookings
      let insertedBookings: any[] = []
      if (newBookings.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('external_urea_bookings')
          .insert(
            newBookings.map(booking => ({
              sync_id: syncId,
              farmer_name: booking.farmer_name || '',
              father_name: booking.father_name || '',
              aadhaar_no: booking.aadhaar_no || '',
              ppb_no: booking.ppb_no || '',
              mobile_no: booking.mobile_no || '',
              village: booking.village || '',
              survey_no: booking.survey_no || '',
              extent: parseFloat(booking.extent) || 0,
              crop: booking.crop || '',
              dealer_name: booking.dealer_name || '',
              booking_id: booking.booking_id || '',
              booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : null,
              urea_qty: parseFloat(booking.urea_qty) || 0,
              status: 'pending',
              raw_data: booking
            }))
          )
          .select()

        if (insertError) {
          throw new Error(`Failed to insert bookings: ${insertError.message}`)
        }
        insertedBookings = inserted || []
        recordsInserted = insertedBookings.length
      }

      // Update existing bookings
      if (bookingsToUpdate.length > 0) {
        for (const booking of bookingsToUpdate) {
          const existing = existingBookings.find(b => b.booking_id === booking.booking_id)
          if (existing) {
            const { error: updateError } = await supabase
              .from('external_urea_bookings')
              .update({
                farmer_name: booking.farmer_name || '',
                father_name: booking.father_name || '',
                aadhaar_no: booking.aadhaar_no || '',
                ppb_no: booking.ppb_no || '',
                mobile_no: booking.mobile_no || '',
                village: booking.village || '',
                survey_no: booking.survey_no || '',
                extent: parseFloat(booking.extent) || 0,
                crop: booking.crop || '',
                dealer_name: booking.dealer_name || '',
                booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : null,
                urea_qty: parseFloat(booking.urea_qty) || 0,
                raw_data: booking,
                updated_at: new Date().toISOString()
              })
              .eq('id', existing.id)

            if (updateError) {
              console.error(`Failed to update booking ${booking.booking_id}:`, updateError)
            }
          }
        }
      }

      // Match bookings with farmer database
      const { error: matchError } = await supabase.rpc('match_urea_bookings_for_sync', { p_sync_id: syncId })
      if (matchError) {
        console.error('Match error:', matchError)
      }

      // Get match statistics
      const { data: stats } = await supabase
        .from('external_urea_bookings')
        .select('status')
        .eq('sync_id', syncId)

      const matchedCount = stats?.filter(s => s.status === 'matched').length || 0
      const unmatchedCount = stats?.filter(s => s.status === 'unmatched').length || 0
      const duplicateCount = stats?.filter(s => s.status === 'duplicate').length || 0

      // Update sync log with completion status
      await supabase
        .from('external_urea_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_imported: bookings.length,
          records_matched: matchedCount,
          records_unmatched: unmatchedCount,
          records_duplicate: duplicateCount,
          login_status: loginStatus,
          api_status: apiStatus,
          http_code: httpCode,
          records_fetched: recordsFetched,
          records_inserted: recordsInserted,
          records_updated: recordsUpdated,
          detailed_error_message: detailedErrorMessage
        })
        .eq('id', syncId)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Synced successfully',
          syncId,
          recordsImported: bookings.length,
          recordsInserted,
          recordsUpdated,
          recordsMatched: matchedCount,
          recordsUnmatched: unmatchedCount,
          recordsDuplicate: duplicateCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Sync error:', error)

      // Update sync log with error status
      await supabase
        .from('external_urea_sync_logs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          detailed_error_message: error.message
        })
        .eq('id', syncId)

      return new Response(
        JSON.stringify({
          error: 'Sync failed',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Server error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function parseUploadedFile(fileData: string, fileName: string): Promise<any[]> {
  try {
    // If it's a base64 encoded file, decode it
    const isBase64 = fileData.startsWith('data:')
    const base64Data = isBase64 ? fileData.split(',')[1] : fileData
    const decodedData = atob(base64Data)
    
    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      return parseCSV(decodedData)
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // For Excel files, use xlsx library
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')
      const workbook = XLSX.read(decodedData, { type: 'base64' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      return jsonData.map((row: any) => ({
        farmer_name: row['Farmer Name'] || row['farmer_name'] || '',
        father_name: row['Father Name'] || row['father_name'] || '',
        aadhaar_no: row['Aadhaar'] || row['aadhaar_no'] || row['Aadhaar No'] || '',
        ppb_no: row['PPB'] || row['ppb_no'] || row['PPB No'] || '',
        mobile_no: row['Mobile'] || row['mobile_no'] || row['Mobile No'] || '',
        village: row['Village'] || row['village'] || '',
        survey_no: row['Survey'] || row['survey_no'] || row['Survey No'] || '',
        extent: row['Extent'] || row['extent'] || 0,
        crop: row['Crop'] || row['crop'] || '',
        dealer_name: row['Dealer'] || row['dealer_name'] || row['Dealer Name'] || '',
        booking_id: row['Booking ID'] || row['booking_id'] || '',
        booking_date: row['Booking Date'] || row['booking_date'] || '',
        urea_qty: row['Urea Qty'] || row['urea_qty'] || row['Urea Quantity'] || 0
      }))
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel.')
    }
  } catch (error) {
    console.error('File parsing error:', error)
    throw new Error(`Failed to parse file: ${error.message}`)
  }
}

function parseCSV(csvData: string): any[] {
  const lines = csvData.split('\n')
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'))
  
  const bookings: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',').map(v => v.trim())
    const booking: any = {}
    
    headers.forEach((header, index) => {
      booking[header] = values[index] || ''
    })
    
    bookings.push(booking)
  }
  
  return bookings
}

async function fetchFromExternalDashboard(syncId: string): Promise<{
  bookings: any[]
  loginStatus: string
  apiStatus: string
  httpCode: number | null
  recordsFetched: number
  detailedErrorMessage: string | null
}> {
  const baseUrl = Deno.env.get('UREA_DASHBOARD_BASE_URL') || 'http://74.225.14.186:8025'
  const apiUrl = Deno.env.get('UREA_DASHBOARD_API_URL') || 'http://74.225.14.186:8026'
  const username = Deno.env.get('UREA_DASHBOARD_USERNAME')
  const password = Deno.env.get('UREA_DASHBOARD_PASSWORD')
  
  if (!username || !password) {
    return {
      bookings: [],
      loginStatus: 'failed',
      apiStatus: 'not_attempted',
      httpCode: null,
      recordsFetched: 0,
      detailedErrorMessage: 'Dashboard credentials not configured in environment variables'
    }
  }

  let cookies: string[] = []
  let loginStatus = 'failed'
  let httpCode = null
  let detailedErrorMessage = null

  try {
    // Step 1: Login to get session cookies
    console.log('Attempting login to:', baseUrl)
    
    // Try multiple login approaches
    let loginResponse: Response | null = null
    
    // Approach 1: POST with form data (current approach)
    try {
      console.log('Trying POST with form data to /login')
      loginResponse = await fetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: username,
          password: password
        })
      })
      console.log('POST /login response status:', loginResponse.status)
    } catch (e) {
      console.log('POST /login failed:', e)
    }

    // Approach 2: POST with JSON data
    if (!loginResponse || loginResponse.status === 405 || loginResponse.status === 404) {
      try {
        console.log('Trying POST with JSON to /login')
        loginResponse = await fetch(`${baseUrl}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password
          })
        })
        console.log('POST JSON /login response status:', loginResponse.status)
      } catch (e) {
        console.log('POST JSON /login failed:', e)
      }
    }

    // Approach 3: GET with query parameters
    if (!loginResponse || loginResponse.status === 405 || loginResponse.status === 404) {
      try {
        console.log('Trying GET with query params to /login')
        loginResponse = await fetch(`${baseUrl}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
          method: 'GET'
        })
        console.log('GET /login response status:', loginResponse.status)
      } catch (e) {
        console.log('GET /login failed:', e)
      }
    }

    // Approach 4: POST to /Account/Login
    if (!loginResponse || loginResponse.status === 405 || loginResponse.status === 404) {
      try {
        console.log('Trying POST to /Account/Login')
        loginResponse = await fetch(`${baseUrl}/Account/Login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            username: username,
            password: password
          })
        })
        console.log('POST /Account/Login response status:', loginResponse.status)
      } catch (e) {
        console.log('POST /Account/Login failed:', e)
      }
    }

    // Approach 5: POST to /api/login
    if (!loginResponse || loginResponse.status === 405 || loginResponse.status === 404) {
      try {
        console.log('Trying POST to /api/login')
        loginResponse = await fetch(`${baseUrl}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username,
            password: password
          })
        })
        console.log('POST /api/login response status:', loginResponse.status)
      } catch (e) {
        console.log('POST /api/login failed:', e)
      }
    }

    if (!loginResponse) {
      return {
        bookings: [],
        loginStatus: 'failed',
        apiStatus: 'not_attempted',
        httpCode: null,
        recordsFetched: 0,
        detailedErrorMessage: 'All login attempts failed'
      }
    }

    httpCode = loginResponse.status
    console.log('Final login response status:', loginResponse.status)

    // Extract cookies from login response
    const setCookieHeader = loginResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      cookies = setCookieHeader.split(',').map(c => c.split(';')[0].trim())
      console.log('Cookies received:', cookies.length)
    }

    // Check if login was successful by checking if we got cookies or redirect
    if (loginResponse.status === 302 || loginResponse.status === 200 || loginResponse.status === 307 || loginResponse.status === 308 || cookies.length > 0) {
      loginStatus = 'success'
    } else {
      const loginText = await loginResponse.text()
      console.log('Login response text:', loginText.substring(0, 200))
      if (loginText.includes('<html') || loginText.includes('<form')) {
        loginStatus = 'failed'
        detailedErrorMessage = 'SESSION_EXPIRED_OR_AUTH_FAILED'
        return {
          bookings: [],
          loginStatus,
          apiStatus: 'not_attempted',
          httpCode,
          recordsFetched: 0,
          detailedErrorMessage
        }
      } else {
        loginStatus = 'failed'
        detailedErrorMessage = `Login failed with status ${loginResponse.status}: ${loginText.substring(0, 100)}`
        return {
          bookings: [],
          loginStatus,
          apiStatus: 'not_attempted',
          httpCode,
          recordsFetched: 0,
          detailedErrorMessage
        }
      }
    }

    // Step 2: Fetch data from dashboard pages (web scraping approach)
    const allBookings: any[] = []
    let apiStatus = 'success'
    
    // Try accessing dashboard report pages directly
    const reportPages = [
      `${baseUrl}/Report/UreaBookingReport`,
      `${baseUrl}/Report/BookingReport`,
      `${baseUrl}/Dashboard`,
      `${baseUrl}/Home/UreaBookingReport`,
    ]

    let workingPage = ''
    let pageResponse: Response | null = null

    for (const pageUrl of reportPages) {
      try {
        console.log('Trying page:', pageUrl)
        pageResponse = await fetch(pageUrl, {
          method: 'GET',
          headers: {
            'Cookie': cookies.join('; '),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          }
        })

        console.log(`Page ${pageUrl} response status:`, pageResponse.status)

        if (pageResponse.ok) {
          const pageText = await pageResponse.text()
          console.log(`Page ${pageUrl} content length:`, pageText.length)
          
          // Check if page contains booking data tables
          if (pageText.includes('table') && (pageText.includes('Farmer') || pageText.includes('Booking') || pageText.includes('Urea'))) {
            workingPage = pageUrl
            console.log('Found working page with data tables:', pageUrl)
            
            // Parse HTML table to extract booking data
            const bookings = parseHTMLTable(pageText)
            if (bookings.length > 0) {
              allBookings.push(...bookings)
              console.log('Extracted bookings from table:', bookings.length)
              break
            }
          }
        }
      } catch (e) {
        console.log(`Page ${pageUrl} failed:`, e)
      }
    }

    if (allBookings.length === 0) {
      apiStatus = 'failed'
      detailedErrorMessage = 'No booking data found on any dashboard page. Manual Excel upload required.'
      return {
        bookings: [],
        loginStatus,
        apiStatus,
        httpCode: pageResponse?.status || null,
        recordsFetched: 0,
        detailedErrorMessage
      }
    }

    console.log('Total bookings extracted:', allBookings.length)

    // Transform booking data to our format
    const transformedBookings = allBookings.map((item: any) => ({
      farmer_name: item.FarmerName || item.farmer_name || '',
      father_name: item.FatherName || item.father_name || '',
      aadhaar_no: item.AadhaarNo || item.aadhaar_no || '',
      ppb_no: item.PPBNo || item.ppb_no || '',
      mobile_no: item.MobileNo || item.mobile_no || '',
      village: item.Village || item.village || '',
      survey_no: item.SurveyNo || item.survey_no || '',
      extent: item.Extent || item.extent || 0,
      crop: item.Crop || item.crop || '',
      dealer_name: item.DealerName || item.dealer_name || '',
      booking_id: item.BookingId || item.booking_id || '',
      booking_date: item.BookingDate || item.booking_date || '',
      urea_qty: item.UreaQty || item.urea_qty || 0
    }))

    return {
      bookings: transformedBookings,
      loginStatus,
      apiStatus,
      httpCode,
      recordsFetched: transformedBookings.length,
      detailedErrorMessage
    }

  } catch (error) {
    console.error('Fetch error:', error)
    return {
      bookings: [],
      loginStatus: 'failed',
      apiStatus: 'failed',
      httpCode: null,
      recordsFetched: 0,
      detailedErrorMessage: error.message
    }
  }
}

function parseHTMLTable(html: string): any[] {
  const bookings: any[] = []
  
  try {
    // Simple HTML table parser
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
    const tableMatches = html.match(tableRegex)
    
    if (!tableMatches) {
      console.log('No tables found in HTML')
      return bookings
    }
    
    for (const tableHtml of tableMatches) {
      // Extract rows
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
      const rowMatches = tableHtml.match(rowRegex)
      
      if (!rowMatches) continue
      
      // Extract headers from first row
      const headers: string[] = []
      const headerMatch = rowMatches[0].match(/<th[^>]*>([\s\S]*?)<\/th>/gi)
      if (headerMatch) {
        for (const header of headerMatch) {
          const text = header.replace(/<[^>]*>/g, '').trim()
          headers.push(text)
        }
      }
      
      // Extract data from remaining rows
      for (let i = 1; i < rowMatches.length; i++) {
        const cellMatch = rowMatches[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi)
        if (!cellMatch) continue
        
        const booking: any = {}
        for (let j = 0; j < Math.min(headers.length, cellMatch.length); j++) {
          const text = cellMatch[j].replace(/<[^>]*>/g, '').trim()
          const header = headers[j].toLowerCase().replace(/[^a-z0-9_]/g, '_')
          booking[header] = text
        }
        
        // Only add if it looks like booking data
        if (Object.keys(booking).length > 0) {
          bookings.push(booking)
        }
      }
    }
    
    console.log('Parsed bookings from HTML:', bookings.length)
    return bookings
  } catch (error) {
    console.error('HTML parsing error:', error)
    return bookings
  }
}
