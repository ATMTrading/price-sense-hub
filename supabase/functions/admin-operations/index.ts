import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, data } = await req.json()

    console.log('Admin operation:', action, data)

    let result

    switch (action) {
      case 'create_feed':
        result = await supabase
          .from('xml_feeds')
          .insert({
            name: data.name,
            url: data.url,
            feed_type: data.feed_type,
            market_code: data.market_code,
            mapping_config: data.mapping_config,
            is_active: true
          })
        break

      case 'update_feed':
        result = await supabase
          .from('xml_feeds')
          .update({
            name: data.name,
            url: data.url,
            feed_type: data.feed_type,
            market_code: data.market_code,
            mapping_config: data.mapping_config
          })
          .eq('id', data.id)
        break

      case 'create_network':
        result = await supabase
          .from('affiliate_networks')
          .insert({
            name: data.name,
            api_endpoint: data.api_endpoint,
            api_key_name: data.api_key_name,
            market_code: data.market_code,
            config: data.config,
            is_active: true
          })
        break

      case 'update_network':
        result = await supabase
          .from('affiliate_networks')
          .update({
            name: data.name,
            api_endpoint: data.api_endpoint,
            api_key_name: data.api_key_name,
            market_code: data.market_code,
            config: data.config
          })
          .eq('id', data.id)
        break

      case 'update_product':
        result = await supabase
          .from('products')
          .update({
            is_featured: data.is_featured
          })
          .eq('id', data.id)
        break

      case 'import_single_product':
        // Call the process-xml-feed function with single product mode
        result = await supabase.functions.invoke('process-xml-feed', {
          body: {
            single_product_url: data.url,
            import_type: 'single_product'
          }
        })
        break

      case 'create_scheduled_job':
        // Create a cron job for scheduled imports
        const cronExpression = data.schedule
        const jobName = `${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
        
        let functionName = 'process-xml-feed'
        let functionBody = { feed_id: data.target_id }
        
        if (data.job_type === 'network_sync') {
          functionName = 'affiliate-api-sync'
          functionBody = { network_id: data.target_id }
        } else if (data.job_type === 'price_update') {
          functionName = 'price-updater'
          functionBody = { update_type: 'all' }
        }

        // Schedule the cron job
        result = await supabase.rpc('schedule_function_call', {
          job_name: jobName,
          cron_schedule: cronExpression,
          function_name: functionName,
          function_args: functionBody
        })
        break

      case 'get_scheduled_jobs':
        // Get all scheduled jobs
        result = await supabase.rpc('get_scheduled_jobs')
        break

      case 'toggle_scheduled_job':
        result = await supabase.rpc('toggle_scheduled_job', {
          job_id: data.id,
          is_active: data.is_active
        })
        break

      case 'delete_scheduled_job':
        result = await supabase.rpc('delete_scheduled_job', {
          job_id: data.id
        })
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    if (result.error) {
      console.error('Database error:', result.error)
      throw result.error
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Admin operation error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})