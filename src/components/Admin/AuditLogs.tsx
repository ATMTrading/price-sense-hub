import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
}

export const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadAuditLogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes('delete') || action.includes('remove')) return 'destructive';
    if (action.includes('create') || action.includes('add')) return 'default';
    if (action.includes('update') || action.includes('modify')) return 'secondary';
    return 'outline';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('view') || action.includes('access')) return <Eye className="h-3 w-3" />;
    if (action.includes('security') || action.includes('admin')) return <Shield className="h-3 w-3" />;
    if (action.includes('error') || action.includes('fail')) return <AlertTriangle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security Audit Trail</h3>
          <p className="text-sm text-muted-foreground">
            Monitor all administrative operations and security events
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          {logs.length} Events
        </Badge>
      </div>

      {logs.length === 0 ? (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            No audit logs found. Administrative operations will be logged here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <CardTitle className="text-sm">{log.action}</CardTitle>
                    <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                      {log.table_name || 'System'}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="font-medium">User ID:</span>
                    <p className="text-muted-foreground font-mono break-all">
                      {log.user_id || 'System'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Record ID:</span>
                    <p className="text-muted-foreground font-mono break-all">
                      {log.record_id || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">IP Address:</span>
                    <p className="text-muted-foreground font-mono">
                      {String(log.ip_address) || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">User Agent:</span>
                    <p className="text-muted-foreground truncate" title={log.user_agent || 'Unknown'}>
                      {log.user_agent || 'Unknown'}
                    </p>
                  </div>
                </div>

                {(log.old_values || log.new_values) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.old_values && (
                        <div>
                          <span className="font-medium text-xs">Previous Values:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.new_values && (
                        <div>
                          <span className="font-medium text-xs">New Values:</span>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};