import { supabase } from "@/integrations/supabase/client";

export const triggerXMLImport = async (feedId: string) => {
  try {
    console.log('🚀 Triggering XML import for feed:', feedId);
    
    const { data, error } = await supabase.functions.invoke('process-xml-feed', {
      body: { feed_id: feedId }
    });

    if (error) {
      console.error('❌ Import error:', error);
      return { success: false, error };
    }

    console.log('✅ Import triggered successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('❌ Failed to trigger import:', err);
    return { success: false, error: err };
  }
};

// Function to check import status
export const checkImportStatus = async () => {
  try {
    const { data: logs, error } = await supabase
      .from('import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching import logs:', error);
      return { success: false, error };
    }

    return { success: true, logs };
  } catch (err) {
    console.error('Failed to check import status:', err);
    return { success: false, error: err };
  }
};