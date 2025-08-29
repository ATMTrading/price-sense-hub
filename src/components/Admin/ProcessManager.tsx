import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Square, AlertTriangle } from "lucide-react";

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

interface ProcessManagerProps {
  logs: ImportLog[];
  onLogsUpdate: () => void;
}

export const ProcessManager = ({ logs, onLogsUpdate }: ProcessManagerProps) => {
  const [deletingLogs, setDeletingLogs] = useState<Set<string>>(new Set());
  const [stoppingLogs, setStoppingLogs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const deleteLog = async (logId: string) => {
    setDeletingLogs(prev => new Set([...prev, logId]));
    
    try {
      const { error } = await supabase
        .from('import_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: "Log deleted",
        description: "Import log has been removed",
      });
      
      onLogsUpdate();
    } catch (error) {
      toast({
        title: "Error deleting log",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setDeletingLogs(prev => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  };

  const stopProcess = async (logId: string) => {
    setStoppingLogs(prev => new Set([...prev, logId]));
    
    try {
      // Update status to stopped
      const { error } = await supabase
        .from('import_logs')
        .update({ 
          status: 'stopped', 
          completed_at: new Date().toISOString() 
        })
        .eq('id', logId);

      if (error) throw error;

      toast({
        title: "Process stopped",
        description: "Import process has been terminated",
      });
      
      onLogsUpdate();
    } catch (error) {
      toast({
        title: "Error stopping process",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setStoppingLogs(prev => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  };

  const bulkDeleteCompleted = async () => {
    const completedLogIds = logs
      .filter(log => log.status === 'completed' || log.status === 'failed')
      .map(log => log.id);

    if (completedLogIds.length === 0) {
      toast({
        title: "No logs to delete",
        description: "No completed or failed logs found",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('import_logs')
        .delete()
        .in('id', completedLogIds);

      if (error) throw error;

      toast({
        title: "Logs cleared",
        description: `Deleted ${completedLogIds.length} completed logs`,
      });
      
      onLogsUpdate();
    } catch (error) {
      toast({
        title: "Error deleting logs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const runningLogs = logs.filter(log => log.status === 'running' || log.status === 'pending');
  const completedLogs = logs.filter(log => log.status === 'completed' || log.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Process Management</h3>
        <div className="flex gap-2">
          {completedLogs.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Completed ({completedLogs.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear Completed Logs</DialogTitle>
                  <DialogDescription>
                    This will permanently delete {completedLogs.length} completed import logs. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => {}}>Cancel</Button>
                  <Button variant="destructive" onClick={bulkDeleteCompleted}>
                    Delete All
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Running Processes Alert */}
      {runningLogs.length > 0 && (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            {runningLogs.length} import process{runningLogs.length > 1 ? 'es' : ''} currently running. 
            You can stop them using the controls below.
          </AlertDescription>
        </Alert>
      )}

      {/* Process Actions for Each Log */}
      <div className="grid gap-2">
        {logs.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant={
                log.status === 'completed' ? 'default' :
                log.status === 'running' || log.status === 'pending' ? 'secondary' :
                log.status === 'failed' ? 'destructive' : 'outline'
              }>
                {log.status}
              </Badge>
              <span className="font-medium">
                {log.import_type.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-muted-foreground">
                {new Date(log.started_at).toLocaleString()}
              </span>
            </div>

            <div className="flex gap-2">
              {(log.status === 'running' || log.status === 'pending') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stopProcess(log.id)}
                  disabled={stoppingLogs.has(log.id)}
                >
                  {stoppingLogs.has(log.id) ? (
                    "Stopping..."
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-1" />
                      Stop
                    </>
                  )}
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteLog(log.id)}
                disabled={deletingLogs.has(log.id)}
              >
                {deletingLogs.has(log.id) ? (
                  "Deleting..."
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};