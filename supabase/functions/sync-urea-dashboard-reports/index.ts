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
    const isBase64 = fileData.startsWith('data:')
    const base64Data = isBase64 ? fileData.split(',')[1] : fileData
    const fileBytes = base64ToBytes(base64Data)
    const normalizedFileName = fileName.toLowerCase()
    
    if (normalizedFileName.endsWith('.csv')) {
      return parseCSV(new TextDecoder('utf-8').decode(fileBytes))
    } else if (normalizedFileName.endsWith('.xlsx') || normalizedFileName.endsWith('.xls')) {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs')
      const workbook = XLSX.read(fileBytes, { type: 'array' })
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

function base64ToBytes(base64Data: string): Uint8Array {
  const binary = atob(base64Data)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
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
  const serviceUsername = Deno.env.get('UREA_DASHBOARD_SERVICE_USERNAME')
  const servicePassword = Deno.env.get('UREA_DASHBOARD_SERVICE_PASSWORD')
  const username = Deno.env.get('UREA_DASHBOARD_USERNAME')
  const password = Deno.env.get('UREA_DASHBOARD_PASSWORD')
  const loginType = Deno.env.get('UREA_DASHBOARD_LOGIN_TYPE') || 'admin'
  const finYear = Deno.env.get('UREA_DASHBOARD_FIN_YEAR') || '2025'
  const season = Deno.env.get('UREA_DASHBOARD_SEASON') || '2'
  const distCode = Deno.env.get('UREA_DASHBOARD_DIST_CODE') || '0'
  const mandCode = Deno.env.get('UREA_DASHBOARD_MAND_CODE') || '0'
  const ifmsId = Deno.env.get('UREA_DASHBOARD_IFMS_ID') || '0'
  const pageSize = Math.max(1, Number(Deno.env.get('UREA_DASHBOARD_PAGE_SIZE') || 1000))
  
  if (!serviceUsername || !servicePassword || !username || !password) {
    return {
      bookings: [],
      loginStatus: 'failed',
      apiStatus: 'not_attempted',
      httpCode: null,
      recordsFetched: 0,
      detailedErrorMessage: 'Dashboard API and user credentials are not fully configured in environment variables'
    }
  }

  let loginStatus = 'failed'
  let apiStatus = 'not_attempted'
  let httpCode = null
  let detailedErrorMessage = null

  try {
    console.log('Fetching urea API bearer token from:', apiUrl)
    const loginResponse = await fetch(`${apiUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Username: serviceUsername,
        Password: servicePassword
      })
    })
    httpCode = loginResponse.status
    if (!loginResponse.ok) {
      const loginText = await loginResponse.text()
      throw new Error(`API token login failed with status ${loginResponse.status}: ${loginText.substring(0, 200)}`)
    }

    const tokenPayload = await loginResponse.json()
    const bearerToken = tokenPayload?.token
    if (!bearerToken) {
      throw new Error('API token login response did not include a bearer token')
    }
    loginStatus = 'success'

    const authorizeResponse = await fetch(`${apiUrl}/api/authorize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName: username,
        password,
        loginCount: 0,
        loginType
      })
    })
    httpCode = authorizeResponse.status
    if (!authorizeResponse.ok) {
      const authorizeText = await authorizeResponse.text()
      throw new Error(`Dashboard user authorization failed with status ${authorizeResponse.status}: ${authorizeText.substring(0, 200)}`)
    }

    const authorizePayload = JSON.parse(await authorizeResponse.text())
    const authorizedUser = Array.isArray(authorizePayload) ? authorizePayload[0] : authorizePayload?.data?.[0] || authorizePayload
    const userId = authorizedUser?.userId || authorizedUser?.UserId || authorizedUser?.userid
    if (!userId) {
      throw new Error('Dashboard authorization response did not include UserId')
    }

    const allBookings: any[] = []
    apiStatus = 'success'

    for (let pageNumber = 1; pageNumber <= 500; pageNumber += 1) {
      const query = new URLSearchParams({
        PageNumber: String(pageNumber),
        PageSize: String(pageSize),
        FinYear: finYear,
        Season: season,
        DistCode: distCode,
        MandCode: mandCode,
        IFMSId: ifmsId,
        UserId: String(userId)
      })
      const reportResponse = await fetch(`${apiUrl}/api/DealerReportsBookingIdWiseDtls?${query.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        }
      })
      httpCode = reportResponse.status
      if (!reportResponse.ok) {
        const reportText = await reportResponse.text()
        throw new Error(`Booking ID wise report failed with status ${reportResponse.status}: ${reportText.substring(0, 200)}`)
      }

      const reportPayload = await reportResponse.json()
      const pageRows = Array.isArray(reportPayload)
        ? reportPayload
        : Array.isArray(reportPayload?.data)
          ? reportPayload.data
          : []
      allBookings.push(...pageRows)

      const totalRecords = Number(reportPayload?.totalRecords ?? reportPayload?.TotalRecords ?? allBookings.length)
      const totalPages = Number(reportPayload?.totalPages ?? reportPayload?.TotalPages ?? Math.ceil(totalRecords / pageSize))
      if (pageRows.length === 0 || pageNumber >= totalPages || allBookings.length >= totalRecords) break
    }

    if (allBookings.length === 0) {
      apiStatus = 'failed'
      detailedErrorMessage = `No booking data returned from ${baseUrl}/reports/dealerreportsbookingidwisedetails`
    }

    const transformedBookings = allBookings.map((item: any) => ({
      farmer_name: pickText(item, ['FarmerName', 'farmer_name', 'farmername']),
      father_name: pickText(item, ['FatherName', 'father_name', 'fathername']),
      aadhaar_no: onlyDigits(pickText(item, ['AadhaarNo', 'aadhaar_no', 'Aadhar', 'aadhar'])),
      ppb_no: pickText(item, ['PPBNo', 'ppb_no', 'ppbno']),
      mobile_no: onlyDigits(pickText(item, ['MobileNo', 'mobile_no', 'FarmerMobileNo', 'farmermobileno', 'farmermobile'])),
      village: pickText(item, ['Village', 'village']),
      survey_no: pickText(item, ['SurveyNo', 'survey_no', 'surveyno']),
      extent: pickNumber(item, ['Extent', 'extent', 'CultivatedExtent', 'cultivatedextent']),
      crop: pickText(item, ['Crop', 'crop', 'CultivatedCrop', 'cultivatedcrop']),
      dealer_name: pickText(item, ['DealerName', 'dealer_name', 'NameOfTheDealer', 'nameofthedealer']),
      booking_id: pickText(item, ['BookingId', 'booking_id', 'bookingid']),
      booking_date: normalizeDate(pickText(item, ['BookingDate', 'booking_date', 'bookingdate'])),
      urea_qty: bagsToMetricTon(pickNumber(item, ['UreaQty', 'urea_qty', 'NoOfBagsBooked', 'noofbagsbooked'])),
      bags_booked: pickNumber(item, ['NoOfBagsBooked', 'noofbagsbooked']),
      booking_status: pickText(item, ['CurrentStatusOfTheBooking', 'currentstatusofthebooking', 'BookingStatus', 'bookingstatus']),
      district: pickText(item, ['District', 'DistName', 'district']),
      mandal: pickText(item, ['Mandal', 'MandName', 'mandal']),
      ifms_id: pickText(item, ['IFMSId', 'ifmsid']),
      raw_source: 'DealerReportsBookingIdWiseDtls'
    })).filter((booking) => booking.booking_id)

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

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[\s_.\-/]/g, '')
}

function pickValue(row: Record<string, unknown>, keys: string[]): unknown {
  const wanted = new Set(keys.map(normalizeKey))
  for (const key of Object.keys(row || {})) {
    if (wanted.has(normalizeKey(key))) {
      const value = row[key]
      if (value !== undefined && value !== null && value !== '') return value
    }
  }
  return ''
}

function pickText(row: Record<string, unknown>, keys: string[]): string {
  const value = pickValue(row, keys)
  if (typeof value === 'object') return ''
  return String(value || '').trim()
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number {
  const value = pickValue(row, keys)
  const parsed = Number(String(value || '').replace(/,/g, '').trim())
  return Number.isFinite(parsed) ? parsed : 0
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function bagsToMetricTon(value: number): number {
  return Number((value * 0.045).toFixed(3))
}

function normalizeDate(value: string): string {
  if (!value || value === '-') return ''
  const trimmed = value.trim()
  const indianDate = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/)
  if (indianDate) {
    const [, day, month, year] = indianDate
    const fullYear = year.length === 2 ? `20${year}` : year
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0]
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
