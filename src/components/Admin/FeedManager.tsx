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
import { useAuditLog } from "@/hooks/useAuditLog";
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
  affiliate_link_template: any;
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
    mapping_config: "{}",
    affiliate_link_template: '{"base_url": "", "url_encode": true}'
  });
  const { toast } = useToast();
  const { logDataAccess, logConfigChange } = useAuditLog();

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
      
      // Log data access
      await logDataAccess('xml_feeds', 'VIEW', data?.length);
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
      const oldData = editingFeed ? { ...editingFeed } : null;
      const newData = {
        ...formData,
        mapping_config: JSON.parse(formData.mapping_config),
        affiliate_link_template: JSON.parse(formData.affiliate_link_template),
        ...(editingFeed && { id: editingFeed.id })
      };

      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: editingFeed ? 'update_feed' : 'create_feed',
          data: newData
        }
      });

      if (error) throw error;

      // Log the configuration change
      await logConfigChange(
        editingFeed ? 'update_xml_feed' : 'create_xml_feed',
        oldData,
        newData,
        editingFeed?.id
      );

      toast({
        title: `Feed ${editingFeed ? 'updated' : 'created'} successfully`,
      });

      setShowForm(false);
      setEditingFeed(null);
      setFormData({ name: "", url: "", feed_type: "xml", market_code: "us", mapping_config: "{}", affiliate_link_template: '{"base_url": "", "url_encode": true}' });
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
      // Get feed details first
      const { data: feed, error: feedError } = await supabase
        .from('xml_feeds')
        .select('*')
        .eq('id', feedId)
        .single();

      if (feedError || !feed) {
        throw new Error('Feed not found');
      }

      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: { 
          feedId: feed.id,
          feedUrl: feed.url,
          marketCode: feed.market_code,
          mappingConfig: feed.mapping_config,
          affiliateLinkTemplate: feed.affiliate_link_template
        }
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

  const triggerTestImport = async (feedId: string) => {
    try {
      // Get feed details first
      const { data: feed, error: feedError } = await supabase
        .from('xml_feeds')
        .select('*')
        .eq('id', feedId)
        .single();

      if (feedError || !feed) {
        throw new Error('Feed not found');
      }

      // Use proper mapping for 4home.hu XML structure if mapping config is empty
      let mappingConfig = feed.mapping_config;
      if (!mappingConfig || Object.keys(mappingConfig).length === 0) {
        mappingConfig = {
          title: 'name',           // ✓ Correct
          description: 'description', // ✓ Correct
          price: 'price',          // ✓ Changed from price_consumer to price
          image_url: 'image_url',  // ✓ Correct
          category: 'category',    // ✓ Correct
          shop: 'manufacturer',    // ✓ Changed from shop to manufacturer
          product_url: 'product_url' // ✓ Correct
        };
      }

      const { error } = await supabase.functions.invoke('process-xml-feed', {
        body: { 
          feedId: feed.id,
          feedUrl: feed.url,
          marketCode: feed.market_code,
          mappingConfig: mappingConfig,
          affiliateLinkTemplate: feed.affiliate_link_template,
          limit: 5
        }
      });

      if (error) throw error;

      toast({
        title: "Test import triggered successfully",
        description: "Importing first 5 products with affiliate links"
      });
    } catch (error) {
      toast({
        title: "Error triggering test import",
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
      mapping_config: JSON.stringify(feed.mapping_config, null, 2),
      affiliate_link_template: JSON.stringify(feed.affiliate_link_template || {"base_url": "", "url_encode": true}, null, 2)
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
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="affiliate_link_template">Affiliate Link Template (JSON)</Label>
                <Textarea
                  id="affiliate_link_template"
                  value={formData.affiliate_link_template}
                  onChange={(e) => setFormData({ ...formData, affiliate_link_template: e.target.value })}
                  rows={4}
                  placeholder='{"base_url": "https://go.dognet.com/?chid=YOUR_ID&url=", "url_encode": true}'
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your affiliate link template. The product URL will be appended to base_url. 
                  Set url_encode to true to URL encode the product link.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingFeed ? 'Update' : 'Create'} Feed
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingFeed(null);
                  setFormData({ name: "", url: "", feed_type: "xml", market_code: "us", mapping_config: "{}", affiliate_link_template: '{"base_url": "", "url_encode": true}' });
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerTestImport(feed.id)}
                    disabled={!feed.is_active}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Test (5)
                  </Button>
                   <Button
                     size="sm"
                     variant="outline"
                     onClick={async () => {
                       try {
                         const { data, error } = await supabase.functions.invoke('debug-xml');
                         if (error) throw error;
                         console.log('XML Debug Result:', data);
                         toast({
                           title: "XML structure logged to console",
                           description: "Check browser console for details"
                         });
                       } catch (error) {
                         console.error('Debug error:', error);
                         toast({
                           title: "Debug failed",
                           description: error instanceof Error ? error.message : "Unknown error",
                           variant: "destructive"
                         });
                       }
                     }}
                     className="bg-blue-500 hover:bg-blue-600 text-white"
                   >
                     🔍 Debug XML
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