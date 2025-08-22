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