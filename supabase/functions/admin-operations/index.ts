import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Helper function to log admin operations
const logAdminOperation = async (supabase: any, action: string, tableName?: string, recordId?: string, oldValues?: any, newValues?: any) => {
  try {
    await supabase.rpc('log_admin_operation', {
      p_action: action,
      p_table_name: tableName || null,
      p_record_id: recordId || null,
      p_old_values: oldValues || null,
      p_new_values: newValues || null
    });
  } catch (error) {
    console.error('Failed to log admin operation:', error);
  }
};

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
    let logDetails = { table: '', recordId: '', oldValues: null, newValues: null }

    switch (action) {
      case 'create_feed':
        // Parse affiliate link template from simple URL
        const parseAffiliateLink = (affiliateUrl: string) => {
          if (!affiliateUrl) return { base_url: "", url_encode: true };
          
          try {
            const url = new URL(affiliateUrl);
            const params = new URLSearchParams(url.search);
            
            // Extract UTM parameters and other tracking parameters
            const utmParams: any = {};
            params.forEach((value, key) => {
              if (key.startsWith('utm_') || ['chid', 'source', 'campaign', 'medium', 'a_aid', 'a_cid', 'chan'].includes(key)) {
                utmParams[key] = value;
              }
            });
            
            // Create base URL without parameters
            const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
            
            return {
              base_url: baseUrl,
              url_encode: true,
              utm_params: utmParams,
              append_product_url: true
            };
          } catch (error) {
            // If parsing fails, treat as simple base URL
            return {
              base_url: affiliateUrl,
              url_encode: true,
              append_product_url: true
            };
          }
        };

        // Auto-analyze feed and create configurations
        let analysisData = null
        try {
          const analysisResult = await supabase.functions.invoke('debug-xml', {
            body: { feedUrl: data.url, marketCode: data.market_code }
          })
          analysisData = analysisResult.data
        } catch (error) {
          console.warn('Feed analysis failed during creation:', error)
        }

        // Parse affiliate template
        const affiliateTemplate = parseAffiliateLink(data.affiliate_link_template?.base_url || data.affiliate_link_template);
        
        result = await supabase
          .from('xml_feeds')
          .insert({
            name: data.name,
            url: data.url,
            feed_type: data.feed_type,
            market_code: data.market_code,
            mapping_config: analysisData?.suggestedMapping || data.mapping_config || {},
            affiliate_link_template: affiliateTemplate,
            is_active: true
          })
        logDetails = { table: 'xml_feeds', recordId: result.data?.[0]?.id, newValues: data }
        break

      case 'update_feed':
        // Get old values first
        const { data: oldFeed } = await supabase
          .from('xml_feeds')
          .select('*')
          .eq('id', data.id)
          .single()
        
        result = await supabase
          .from('xml_feeds')
          .update({
            name: data.name,
            url: data.url,
            feed_type: data.feed_type,
            market_code: data.market_code,
            mapping_config: data.mapping_config,
            affiliate_link_template: data.affiliate_link_template
          })
          .eq('id', data.id)
        logDetails = { table: 'xml_feeds', recordId: data.id, oldValues: oldFeed, newValues: data }
        break

      case 'update_feed_structure':
        // Update feed with analyzed XML structure
        result = await supabase
          .from('xml_feeds')
          .update({
            mapping_config: data.suggested_mapping
          })
          .eq('url', data.feed_url)
        logDetails = { table: 'xml_feeds', recordId: null, oldValues: null, newValues: { structure_analyzed: true } }
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
        logDetails = { table: 'affiliate_networks', recordId: result.data?.[0]?.id, newValues: data }
        break

      case 'update_network':
        // Get old values first
        const { data: oldNetwork } = await supabase
          .from('affiliate_networks')
          .select('*')
          .eq('id', data.id)
          .single()
        
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
        logDetails = { table: 'affiliate_networks', recordId: data.id, oldValues: oldNetwork, newValues: data }
        break

      case 'update_product':
        // Get old values first
        const { data: oldProduct } = await supabase
          .from('products')
          .select('*')
          .eq('id', data.id)
          .single()
        
        result = await supabase
          .from('products')
          .update({
            is_featured: data.is_featured
          })
          .eq('id', data.id)
        logDetails = { table: 'products', recordId: data.id, oldValues: oldProduct, newValues: { is_featured: data.is_featured } }
        break

      case 'import_single_product':
        // Call the process-xml-feed function with single product mode
        result = await supabase.functions.invoke('process-xml-feed', {
          body: {
            single_product_url: data.url,
            import_type: 'single_product'
          }
        })
        await logAdminOperation(supabase, 'IMPORT_SINGLE_PRODUCT', 'products', null, null, { url: data.url })
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
          if (data.update_scope === 'feed') {
            functionBody = { update_type: 'feed', feed_id: data.target_id }
          } else if (data.update_scope === 'network') {
            functionBody = { update_type: 'network', network_id: data.target_id }
          } else {
            functionBody = { update_type: 'all' }
          }
        }

        // Schedule the cron job
        result = await supabase.rpc('schedule_function_call', {
          job_name: jobName,
          cron_schedule: cronExpression,
          function_name: functionName,
          function_args: functionBody
        })
        await logAdminOperation(supabase, 'CREATE_SCHEDULED_JOB', 'scheduled_jobs', null, null, { job_name: jobName, schedule: cronExpression, function: functionName })
        break

      case 'get_scheduled_jobs':
        // Get all scheduled jobs
        result = await supabase.rpc('get_scheduled_jobs')
        await logAdminOperation(supabase, 'VIEW_SCHEDULED_JOBS', 'scheduled_jobs')
        break

      case 'toggle_scheduled_job':
        result = await supabase.rpc('toggle_scheduled_job', {
          job_id: data.id,
          is_active: data.is_active
        })
        await logAdminOperation(supabase, 'TOGGLE_SCHEDULED_JOB', 'scheduled_jobs', data.id.toString(), null, { is_active: data.is_active })
        break

      case 'delete_scheduled_job':
        result = await supabase.rpc('delete_scheduled_job', {
          job_id: data.id
        })
        await logAdminOperation(supabase, 'DELETE_SCHEDULED_JOB', 'scheduled_jobs', data.id.toString())
        break

      case 'delete_feed':
        // Get old values first for audit log
        const { data: feedToDelete } = await supabase
          .from('xml_feeds')
          .select('*')
          .eq('id', data.id)
          .single()
        
        // Soft delete by setting is_active to false (preserves audit trail)
        result = await supabase
          .from('xml_feeds')
          .update({ is_active: false })
          .eq('id', data.id)
        logDetails = { table: 'xml_feeds', recordId: data.id, oldValues: feedToDelete, newValues: { is_active: false } }
        break
        
      case 'update_feed_structure':
        // Update feed with structure analysis and category mapping
        const updatedMapping = {
          ...data.structure_analysis.suggestedMapping,
          category_mapping: data.category_mapping
        }
        
        result = await supabase
          .from('xml_feeds')
          .update({ 
            mapping_config: updatedMapping,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.feed_id)
        
        logDetails = { 
          table: 'xml_feeds', 
          recordId: data.feed_id, 
          newValues: { mapping_config: updatedMapping } 
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    if (result.error) {
      console.error('Database error:', result.error)
      throw result.error
    }

    // Log the operation if not already logged
    if (logDetails.table && !['import_single_product', 'create_scheduled_job', 'get_scheduled_jobs', 'toggle_scheduled_job', 'delete_scheduled_job'].includes(action)) {
      await logAdminOperation(supabase, action.toUpperCase(), logDetails.table, logDetails.recordId, logDetails.oldValues, logDetails.newValues)
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