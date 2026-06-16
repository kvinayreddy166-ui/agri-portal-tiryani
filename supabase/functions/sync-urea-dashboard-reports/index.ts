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

      if (syncType === 'manual_upload' && fileData && fileName) {
        // Parse uploaded file (Excel/CSV)
        bookings = await parseUploadedFile(fileData, fileName)
      } else {
        // Auto sync from external dashboard
        bookings = await fetchFromExternalDashboard()
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
            records_duplicate: 0
          })
          .eq('id', syncId)

        return new Response(
          JSON.stringify({
            success: true,
            message: 'No records found to import',
            syncId,
            recordsImported: 0,
            recordsMatched: 0,
            recordsUnmatched: 0,
            recordsDuplicate: 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Insert bookings into database
      const { data: insertedBookings, error: insertError } = await supabase
        .from('external_urea_bookings')
        .insert(
          bookings.map(booking => ({
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
          records_duplicate: duplicateCount
        })
        .eq('id', syncId)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Synced successfully',
          syncId,
          recordsImported: bookings.length,
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
          error_message: error.message
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
  // This is a placeholder for parsing Excel/CSV files
  // In a real implementation, you would use a library like xlsx or csv-parser
  // For now, we'll return a sample structure
  
  try {
    // If it's a base64 encoded file, decode it
    const isBase64 = fileData.startsWith('data:')
    const base64Data = isBase64 ? fileData.split(',')[1] : fileData
    const decodedData = atob(base64Data)
    
    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      return parseCSV(decodedData)
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // For Excel files, you would need to use a library like xlsx
      // This is a simplified version
      throw new Error('Excel parsing requires additional libraries. Please use CSV format.')
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

async function fetchFromExternalDashboard(): Promise<any[]> {
  // This is a placeholder for fetching data from the external dashboard
  // In a real implementation, you would:
  // 1. Login to the dashboard using credentials from environment variables
  // 2. Navigate to the reports section
  // 3. Download/extract the data
  // 4. Parse and return the bookings
  
  const dashboardUrl = Deno.env.get('UREA_DASHBOARD_URL') || 'http://74.225.14.186:8025/dashboard'
  const dashboardUsername = Deno.env.get('UREA_DASHBOARD_USERNAME')
  const dashboardPassword = Deno.env.get('UREA_DASHBOARD_PASSWORD')
  
  if (!dashboardUsername || !dashboardPassword) {
    throw new Error('Dashboard credentials not configured in environment variables')
  }
  
  // Placeholder implementation - in reality, this would use puppeteer or similar
  // to automate the login and data extraction process
  console.log('Attempting to fetch from external dashboard:', dashboardUrl)
  
  // For now, return empty array as the actual implementation would require
  // browser automation which is complex in edge functions
  throw new Error('Auto-sync from external dashboard requires browser automation. Please use manual upload for now.')
}
