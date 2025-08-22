import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus, Trash, Play, Pause } from "lucide-react";

interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  job_type: string;
  target_id: string;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
}

export const ScheduleManager = () => {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    schedule: "0 */6 * * *", // Every 6 hours default
    job_type: "feed_import",
    target_id: ""
  });
  const [feeds, setFeeds] = useState([]);
  const [networks, setNetworks] = useState([]);
  const { toast } = useToast();

  console.log('ScheduleManager render - jobs:', jobs, 'type:', typeof jobs, 'isArray:', Array.isArray(jobs));

  useEffect(() => {
    loadJobs();
    loadFeeds();
    loadNetworks();
  }, []);

  const loadJobs = async () => {
    console.log('loadJobs called');
    try {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_scheduled_jobs' }
      });

      console.log('admin-operations response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        setJobs([]);
        throw error;
      }
      
      // Ensure data is always an array, even if the function returns an error object
      if (data && Array.isArray(data)) {
        console.log('Setting jobs to array:', data);
        setJobs(data);
      } else if (data && typeof data === 'object' && data.error) {
        console.error('Database error in response:', data.error);
        setJobs([]); // Set empty array if there's a database error
        toast({
          title: "Error loading scheduled jobs",
          description: "Database error: " + data.error,
          variant: "destructive"
        });
      } else {
        console.log('Setting jobs to fallback array:', data || []);
        setJobs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]); // Always ensure jobs is an array
      toast({
        title: "Error loading scheduled jobs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeeds = async () => {
    const { data } = await supabase.from('xml_feeds').select('id, name').eq('is_active', true);
    setFeeds(data || []);
  };

  const loadNetworks = async () => {
    const { data } = await supabase.from('affiliate_networks').select('id, name').eq('is_active', true);
    setNetworks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'create_scheduled_job',
          data: formData
        }
      });

      if (error) throw error;

      toast({
        title: "Scheduled job created successfully",
      });

      setShowForm(false);
      setFormData({ name: "", schedule: "0 */6 * * *", job_type: "feed_import", target_id: "" });
      loadJobs();
    } catch (error) {
      toast({
        title: "Error creating scheduled job",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const toggleJob = async (jobId: string, isActive: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'toggle_scheduled_job',
          data: { id: jobId, is_active: !isActive }
        }
      });

      if (error) throw error;

      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, is_active: !isActive } : job
      ));

      toast({
        title: `Job ${!isActive ? 'activated' : 'paused'}`,
      });
    } catch (error) {
      toast({
        title: "Error updating job",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_scheduled_job',
          data: { id: jobId }
        }
      });

      if (error) throw error;

      setJobs(prev => prev.filter(job => job.id !== jobId));
      toast({
        title: "Job deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error deleting job",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const schedulePresets = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Every 12 hours", value: "0 */12 * * *" },
    { label: "Daily at 2 AM", value: "0 2 * * *" },
    { label: "Daily at 6 AM", value: "0 6 * * *" },
    { label: "Every Monday at 8 AM", value: "0 8 * * 1" },
  ];

  // Always ensure jobs is an array - final safeguard
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  console.log('safeJobs:', safeJobs, 'original jobs:', jobs);

  if (loading) {
    return <div>Loading scheduled jobs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Scheduled Jobs</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Scheduled Job</CardTitle>
            <CardDescription>Set up automatic imports and price updates</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Job Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Daily Electronics Import"
                  required
                />
              </div>

              <div>
                <Label htmlFor="job_type">Job Type</Label>
                <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed_import">XML Feed Import</SelectItem>
                    <SelectItem value="network_sync">Affiliate Network Sync</SelectItem>
                    <SelectItem value="price_update">Price & Availability Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.job_type === 'feed_import' && (
                <div>
                  <Label htmlFor="target_id">XML Feed</Label>
                  <Select value={formData.target_id} onValueChange={(value) => setFormData({ ...formData, target_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a feed" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeds.map((feed: any) => (
                        <SelectItem key={feed.id} value={feed.id}>{feed.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.job_type === 'network_sync' && (
                <div>
                  <Label htmlFor="target_id">Affiliate Network</Label>
                  <Select value={formData.target_id} onValueChange={(value) => setFormData({ ...formData, target_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a network" />
                    </SelectTrigger>
                    <SelectContent>
                      {networks.map((network: any) => (
                        <SelectItem key={network.id} value={network.id}>{network.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="schedule">Schedule (Cron Expression)</Label>
                <Select value={formData.schedule} onValueChange={(value) => setFormData({ ...formData, schedule: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {schedulePresets.map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label} ({preset.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create Job</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {safeJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {job.name}
                    <Badge variant={job.is_active ? "default" : "secondary"}>
                      {job.is_active ? "Active" : "Paused"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {job.job_type.replace('_', ' ').toUpperCase()} • {job.schedule}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={job.is_active ? "outline" : "default"}
                    onClick={() => toggleJob(job.id, job.is_active)}
                  >
                    {job.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteJob(job.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {job.last_run && (
                  <p>Last run: {new Date(job.last_run).toLocaleString()}</p>
                )}
                {job.next_run && (
                  <p>Next run: {new Date(job.next_run).toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {safeJobs.length === 0 && (
        <Alert>
          <AlertDescription>
            No scheduled jobs configured. Create automatic imports to keep your products updated.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};