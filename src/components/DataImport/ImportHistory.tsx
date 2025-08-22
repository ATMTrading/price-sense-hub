import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMarket } from '@/hooks/useMarket';
import { History, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  xml_feeds?: { name: string } | null;
  affiliate_networks?: { name: string } | null;
}

export function ImportHistory() {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { market } = useMarket();

  useEffect(() => {
    fetchLogs();
  }, [market]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select(`
          *,
          xml_feeds!inner(name, market_code),
          affiliate_networks!inner(name, market_code)
        `)
        .or(`xml_feeds.market_code.eq.${market.code},affiliate_networks.market_code.eq.${market.code}`)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching import logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch import history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDuration = (started: string, completed: string | null) => {
    if (!completed) return 'In progress...';
    
    const start = new Date(started);
    const end = new Date(completed);
    const diffMs = end.getTime() - start.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.round(diffSeconds / 60);
    return `${diffMinutes}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Import History
            </CardTitle>
            <Button onClick={fetchLogs} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No import history available yet
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <h3 className="font-medium">
                          {log.import_type === 'xml_feed' ? 'XML Feed Import' : 'Affiliate API Sync'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {log.xml_feeds?.name || log.affiliate_networks?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(log.status)}>
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(log.started_at, log.completed_at)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {log.products_processed}
                      </div>
                      <div className="text-xs text-muted-foreground">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {log.products_created}
                      </div>
                      <div className="text-xs text-muted-foreground">Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {log.products_updated}
                      </div>
                      <div className="text-xs text-muted-foreground">Updated</div>
                    </div>
                  </div>

                  {log.errors && log.errors.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">
                          {log.errors.length} error{log.errors.length > 1 ? 's' : ''} occurred:
                        </div>
                        <ul className="text-sm space-y-1">
                          {log.errors.slice(0, 3).map((error, index) => (
                            <li key={index} className="truncate">• {error}</li>
                          ))}
                          {log.errors.length > 3 && (
                            <li className="text-muted-foreground">
                              ... and {log.errors.length - 3} more
                            </li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="text-xs text-muted-foreground mt-3">
                    Started: {new Date(log.started_at).toLocaleString()}
                    {log.completed_at && (
                      <span className="ml-4">
                        Completed: {new Date(log.completed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}