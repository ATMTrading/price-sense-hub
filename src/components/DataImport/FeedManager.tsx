import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMarket } from '@/hooks/useMarket';
import { Plus, Download, Settings, Trash2, Play } from 'lucide-react';

interface XMLFeed {
  id: string;
  name: string;
  url: string;
  feed_type: string;
  mapping_config: any;
  is_active: boolean;
  last_imported_at: string | null;
  created_at: string;
}

export function FeedManager() {
  const [feeds, setFeeds] = useState<XMLFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    feed_type: 'xml',
    mapping_config: JSON.stringify({
      title: 'title',
      description: 'description',
      price: 'price',
      currency: 'currency',
      image_url: 'image_url',
      category: 'category',
      shop: 'shop',
      affiliate_url: 'link'
    }, null, 2)
  });
  const { toast } = useToast();
  const { market } = useMarket();

  useEffect(() => {
    fetchFeeds();
  }, [market]);

  const fetchFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('xml_feeds')
        .select('*')
        .eq('market_code', market.code)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeeds(data || []);
    } catch (error) {
      console.error('Error fetching feeds:', error);
      toast({
        title: "Error",
        description: "Failed to fetch XML feeds",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mappingConfig;
      try {
        mappingConfig = JSON.parse(formData.mapping_config);
      } catch {
        throw new Error('Invalid JSON in mapping configuration');
      }

      const { error } = await supabase
        .from('xml_feeds')
        .insert({
          name: formData.name,
          url: formData.url,
          feed_type: formData.feed_type,
          mapping_config: mappingConfig,
          market_code: market.code,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "XML feed configuration saved successfully",
      });

      setFormData({
        name: '',
        url: '',
        feed_type: 'xml',
        mapping_config: JSON.stringify({
          title: 'title',
          description: 'description',
          price: 'price',
          currency: 'currency',
          image_url: 'image_url',
          category: 'category',
          shop: 'shop',
          affiliate_url: 'link'
        }, null, 2)
      });

      fetchFeeds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processFeed = async (feedId: string, feedUrl: string, mappingConfig: any) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feedId,
          feedUrl,
          marketCode: market.code,
          mappingConfig
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      toast({
        title: "Import Started",
        description: `Processing ${result.productsProcessed} products. ${result.productsCreated} created, ${result.productsUpdated} updated.`,
      });

      fetchFeeds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process XML feed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFeed = async (feedId: string) => {
    try {
      const { error } = await supabase
        .from('xml_feeds')
        .delete()
        .eq('id', feedId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "XML feed deleted successfully",
      });

      fetchFeeds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add XML Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Feed Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Product Feed"
                  required
                />
              </div>
              <div>
                <Label htmlFor="feed_type">Feed Type</Label>
                <Select value={formData.feed_type} onValueChange={(value) => setFormData({ ...formData, feed_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="url">Feed URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/feed.xml"
                required
              />
            </div>

            <div>
              <Label htmlFor="mapping_config">Field Mapping Configuration (JSON)</Label>
              <Textarea
                id="mapping_config"
                value={formData.mapping_config}
                onChange={(e) => setFormData({ ...formData, mapping_config: e.target.value })}
                rows={8}
                className="font-mono text-sm"
                placeholder="Field mapping configuration..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Configure how feed fields map to your product schema
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Feed Configuration'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            XML Feeds ({feeds.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feeds.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No XML feeds configured yet
            </p>
          ) : (
            <div className="space-y-4">
              {feeds.map((feed) => (
                <div key={feed.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{feed.name}</h3>
                      <Badge variant={feed.is_active ? "default" : "secondary"}>
                        {feed.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{feed.feed_type.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => processFeed(feed.id, feed.url, feed.mapping_config)}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Import
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteFeed(feed.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{feed.url}</p>
                  {feed.last_imported_at && (
                    <p className="text-xs text-muted-foreground">
                      Last imported: {new Date(feed.last_imported_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}