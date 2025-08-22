import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportLog {
  id: string;
  import_type: string;
  status: string;
  products_processed: number;
  products_created: number;
  products_updated: number;
  errors: any;
  started_at: string;
  completed_at: string | null;
  feed_id: string | null;
  network_id: string | null;
}

export const ImportLogs = () => {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      toast({
        title: "Error loading logs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return <div>Loading import logs...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Import Logs</h2>

      <div className="grid gap-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {log.import_type.replace('_', ' ').toUpperCase()}
                    <Badge variant={getStatusBadgeVariant(log.status)}>
                      {log.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Started: {new Date(log.started_at).toLocaleString()}
                    {log.completed_at && (
                      <> • Completed: {new Date(log.completed_at).toLocaleString()}</>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Processed</p>
                  <p className="text-2xl font-bold text-primary">{log.products_processed}</p>
                </div>
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-2xl font-bold text-green-600">{log.products_created}</p>
                </div>
                <div>
                  <p className="font-medium">Updated</p>
                  <p className="text-2xl font-bold text-blue-600">{log.products_updated}</p>
                </div>
              </div>
              
              {log.errors && Array.isArray(log.errors) && log.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-destructive mb-2">Errors ({log.errors.length})</p>
                  <div className="space-y-1 text-sm text-muted-foreground max-h-32 overflow-y-auto">
                    {log.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-destructive">{JSON.stringify(error)}</p>
                    ))}
                    {log.errors.length > 5 && (
                      <p className="text-muted-foreground">... and {log.errors.length - 5} more errors</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {logs.length === 0 && (
        <Alert>
          <AlertDescription>
            No import logs found. Import logs will appear here after running imports.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};