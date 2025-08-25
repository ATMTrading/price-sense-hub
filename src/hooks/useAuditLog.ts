import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuditLog = () => {
  const { toast } = useToast();

  const logAdminOperation = async (
    action: string,
    tableName?: string,
    recordId?: string,
    oldValues?: any,
    newValues?: any
  ) => {
    try {
      const { error } = await supabase.rpc('log_admin_operation', {
        p_action: action,
        p_table_name: tableName || null,
        p_record_id: recordId || null,
        p_old_values: oldValues || null,
        p_new_values: newValues || null
      });

      if (error) {
        console.error('Failed to log admin operation:', error);
        // Don't show toast for logging failures to avoid UX disruption
      }
    } catch (error) {
      console.error('Error logging admin operation:', error);
    }
  };

  const logSecurityEvent = async (
    event: string,
    details?: any
  ) => {
    await logAdminOperation(`SECURITY_EVENT: ${event}`, 'security', undefined, undefined, details);
  };

  const logDataAccess = async (
    resource: string,
    action: 'VIEW' | 'EXPORT' | 'DOWNLOAD',
    recordCount?: number
  ) => {
    await logAdminOperation(
      `DATA_ACCESS: ${action} ${resource}`,
      resource,
      undefined,
      undefined,
      { record_count: recordCount, timestamp: new Date().toISOString() }
    );
  };

  const logConfigChange = async (
    configType: string,
    oldConfig: any,
    newConfig: any,
    recordId?: string
  ) => {
    await logAdminOperation(
      `CONFIG_CHANGE: ${configType}`,
      configType,
      recordId,
      oldConfig,
      newConfig
    );
  };

  return {
    logAdminOperation,
    logSecurityEvent,
    logDataAccess,
    logConfigChange
  };
};