import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Plus, Edit, Trash } from "lucide-react";

interface XmlFeed {
  id: string;
  name: string;
  url: string;
  feed_type: string;
  market_code: string;
  is_active: boolean;
  last_imported_at: string | null;
  mapping_config: any;
}

export const FeedManager = () => {
  const [feeds, setFeeds] = useState<XmlFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFeed, setEditingFeed] = useState<XmlFeed | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    feed_type: "xml",
    market_code: "us",
    mapping_config: "{}"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('xml_feeds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeds(data || []);
    } catch (error) {
      toast({
        title: "Error loading feeds",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: editingFeed ? 'update_feed' : 'create_feed',
          data: {
            ...formData,
            mapping_config: JSON.parse(formData.mapping_config),
            ...(editingFeed && { id: editingFeed.id })
          }
        }
      });

      if (error) throw error;

      toast({
        title: `Feed ${editingFeed ? 'updated' : 'created'} successfully`,
      });

      setShowForm(false);
      setEditingFeed(null);
      setFormData({ name: "", url: "", feed_type: "xml", market_code: "us", mapping_config: "{}" });
      loadFeeds();
    } catch (error) {
      toast({
        title: "Error saving feed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const triggerImport = async (feedId: string) => {
    try {
      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: { feed_id: feedId }
      });

      if (error) throw error;

      toast({
        title: "Import triggered successfully",
        description: "The import process has been started"
      });
    } catch (error) {
      toast({
        title: "Error triggering import",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const editFeed = (feed: XmlFeed) => {
    setEditingFeed(feed);
    setFormData({
      name: feed.name,
      url: feed.url,
      feed_type: feed.feed_type,
      market_code: feed.market_code,
      mapping_config: JSON.stringify(feed.mapping_config, null, 2)
    });
    setShowForm(true);
  };

  if (loading) {
    return <div>Loading feeds...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">XML Feeds</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Feed
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFeed ? 'Edit Feed' : 'Add New Feed'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="market_code">Market Code</Label>
                <Input
                  id="market_code"
                  value={formData.market_code}
                  onChange={(e) => setFormData({ ...formData, market_code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="mapping_config">Mapping Configuration (JSON)</Label>
                <Textarea
                  id="mapping_config"
                  value={formData.mapping_config}
                  onChange={(e) => setFormData({ ...formData, mapping_config: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingFeed ? 'Update' : 'Create'} Feed
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingFeed(null);
                  setFormData({ name: "", url: "", feed_type: "xml", market_code: "us", mapping_config: "{}" });
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {feeds.map((feed) => (
          <Card key={feed.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {feed.name}
                    <Badge variant={feed.is_active ? "default" : "secondary"}>
                      {feed.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{feed.url}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => triggerImport(feed.id)}
                    disabled={!feed.is_active}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => editFeed(feed)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Type: {feed.feed_type}</p>
                <p>Market: {feed.market_code}</p>
                {feed.last_imported_at && (
                  <p>Last imported: {new Date(feed.last_imported_at).toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {feeds.length === 0 && (
        <Alert>
          <AlertDescription>
            No feeds configured yet. Add your first XML feed to start importing products.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};