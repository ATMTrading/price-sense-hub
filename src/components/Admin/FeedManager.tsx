import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Play, Plus, Edit, Trash, Search, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
  const [debugResult, setDebugResult] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    feed_type: "xml",
    market_code: "us",
    affiliate_link: ""
  });
  const [analyzingFeed, setAnalyzingFeed] = useState(false);
  const [feedAnalysis, setFeedAnalysis] = useState<any>(null);
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
        .eq('is_active', true)
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

  const analyzeFeed = async (url: string) => {
    if (!url) return;
    
    setAnalyzingFeed(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-xml', {
        body: { feedUrl: url }
      });

      if (error) throw error;
      
      setFeedAnalysis(data);
      toast({
        title: "Feed analyzed successfully",
        description: `Found ${data.detectedFields.length} fields and ${data.feedOverview.totalProducts} products`,
      });
    } catch (error) {
      toast({
        title: "Feed analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze feed",
        variant: "destructive"
      });
    } finally {
      setAnalyzingFeed(false);
    }
  };

  const parseAffiliateLink = (affiliateUrl: string) => {
    if (!affiliateUrl) return { base_url: "", url_encode: true };
    
    try {
      const url = new URL(affiliateUrl);
      const params = new URLSearchParams(url.search);
      
      // Extract UTM parameters and other tracking parameters
      const utmParams: any = {};
      params.forEach((value, key) => {
        if (key.startsWith('utm_') || ['chid', 'source', 'campaign', 'medium'].includes(key)) {
          utmParams[key] = value;
        }
      });
      
      // Create base URL without product URL parameter
      const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
      
      return {
        base_url: baseUrl,
        url_encode: true,
        utm_params: utmParams,
        append_product_url: true
      };
    } catch (error) {
      // If parsing fails, treat as simple base URL
      return {
        base_url: affiliateUrl,
        url_encode: true,
        append_product_url: true
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Auto-generate mapping configuration from analysis
      const mappingConfig = feedAnalysis?.suggestedMapping || {};
      
      // Auto-generate affiliate link template from simple URL
      const affiliateLinkTemplate = parseAffiliateLink(formData.affiliate_link);

      const action = editingFeed ? 'update_feed' : 'create_feed';
      const requestData = {
        action,
        data: {
          name: formData.name,
          url: formData.url,
          feed_type: formData.feed_type,
          market_code: formData.market_code,
          mapping_config: mappingConfig,
          affiliate_link_template: affiliateLinkTemplate,
          ...(editingFeed && { id: editingFeed.id })
        }
      };

      const { error } = await supabase.functions.invoke('admin-operations', {
        body: requestData
      });

      if (error) throw error;

      toast({
        title: editingFeed ? "Feed updated" : "Feed created",
        description: editingFeed ? "XML feed has been successfully updated" : "XML feed has been created with automatic analysis and configuration",
      });

      // Log the configuration change
      await logConfigChange(
        editingFeed ? 'update_xml_feed' : 'create_xml_feed',
        editingFeed,
        requestData.data,
        editingFeed?.id
      );

      // Reset form and reload feeds
      setShowForm(false);
      setEditingFeed(null);
      setFeedAnalysis(null);
      setFormData({
        name: '',
        url: '',
        feed_type: 'xml',
        market_code: 'us',
        affiliate_link: ''
      });
      
      await loadFeeds();
      
    } catch (error) {
      toast({
        title: "Error saving feed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    const affiliateLink = feed.affiliate_link_template?.base_url || '';
    setFormData({
      name: feed.name,
      url: feed.url,
      feed_type: feed.feed_type,
      market_code: feed.market_code,
      affiliate_link: affiliateLink
    });
    setShowForm(true);
    // Trigger analysis for existing feed
    if (feed.url) {
      analyzeFeed(feed.url);
    }
  };

  const deleteFeed = async (feedId: string, feedName: string) => {
    try {
      const { error } = await supabase.functions.invoke('admin-operations', {
        body: {
          action: 'delete_feed',
          data: { id: feedId }
        }
      });

      if (error) throw error;

      toast({
        title: "Feed deleted",
        description: `${feedName} has been successfully deleted`,
      });

      await loadFeeds();
    } catch (error) {
      toast({
        title: "Error deleting feed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
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
                <Label htmlFor="url">XML Feed URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => analyzeFeed(formData.url)}
                    disabled={!formData.url || analyzingFeed}
                  >
                    {analyzingFeed ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
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
                <Label htmlFor="affiliate_link">Affiliate Link with UTM Parameters</Label>
                <Input
                  id="affiliate_link"
                  type="url"
                  value={formData.affiliate_link}
                  onChange={(e) => setFormData({ ...formData, affiliate_link: e.target.value })}
                  placeholder="https://go.dognet.com/?chid=YOUR_ID&utm_source=your_site&utm_campaign=product_links"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your complete affiliate link with UTM parameters. The system will automatically parse and configure it for product URLs.
                </p>
              </div>

              {feedAnalysis && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Feed Analysis Complete</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Products Found:</strong> {feedAnalysis.feedOverview?.totalProducts || 0}</p>
                    <p><strong>Fields Detected:</strong> {feedAnalysis.detectedFields?.length || 0}</p>
                    <p><strong>Mapping Suggestions:</strong> {Object.keys(feedAnalysis.suggestedMapping || {}).length} field mappings generated</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit">
                  {editingFeed ? 'Update' : 'Create'} Feed
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingFeed(null);
                  setFeedAnalysis(null);
                  setFormData({ name: "", url: "", feed_type: "xml", market_code: "us", affiliate_link: "" });
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
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={async () => {
                           setDebugLoading(true);
                           try {
                             const { data, error } = await supabase.functions.invoke('debug-xml', {
                               body: { feedUrl: feed.url }
                             });
                             if (error) throw error;
                             setDebugResult(data);
                           } catch (error) {
                             console.error('Debug error:', error);
                             toast({
                               title: "Debug failed",
                               description: error instanceof Error ? error.message : "Unknown error",
                               variant: "destructive"
                             });
                           } finally {
                             setDebugLoading(false);
                           }
                         }}
                         disabled={debugLoading}
                       >
                         <Search className="w-4 h-4 mr-1" />
                         {debugLoading ? 'Analyzing...' : 'Debug XML'}
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="max-w-4xl max-h-[80vh]">
                       <DialogHeader>
                         <DialogTitle>XML Feed Analysis: {feed.name}</DialogTitle>
                         <DialogDescription>
                           Comprehensive analysis of XML structure and suggested field mappings
                         </DialogDescription>
                       </DialogHeader>
                       {debugResult && (
                         <ScrollArea className="h-[60vh]">
                           <div className="space-y-6">
                             {/* Validation Status */}
                             <div className="flex items-center gap-2">
                               {debugResult.validation?.hasProducts ? (
                                 <CheckCircle className="w-5 h-5 text-green-500" />
                               ) : (
                                 <AlertTriangle className="w-5 h-5 text-red-500" />
                               )}
                               <span className="font-semibold">
                                 {debugResult.validation?.hasProducts ? 'Valid XML Feed' : 'Issues Detected'}
                               </span>
                             </div>

                             {/* Warnings */}
                             {debugResult.validation?.warnings?.length > 0 && (
                               <Alert>
                                 <AlertTriangle className="w-4 h-4" />
                                 <AlertDescription>
                                   <strong>Warnings:</strong>
                                   <ul className="list-disc list-inside mt-2">
                                     {debugResult.validation.warnings.map((warning: string, i: number) => (
                                       <li key={i}>{warning}</li>
                                     ))}
                                   </ul>
                                 </AlertDescription>
                               </Alert>
                             )}

                             {/* Feed Overview */}
                             <div>
                               <h3 className="font-semibold mb-3">Feed Overview</h3>
                               <div className="grid grid-cols-2 gap-4 text-sm">
                                 <div>
                                   <strong>Root Element:</strong> {debugResult.rootElement}
                                 </div>
                                 <div>
                                   <strong>Product Element:</strong> {debugResult.detectedProductElement}
                                 </div>
                                 <div>
                                   <strong>Product Count:</strong> {debugResult.productCount?.toLocaleString()}
                                 </div>
                                 <div>
                                   <strong>XML Size:</strong> {Math.round(debugResult.xmlLength / 1024)} KB
                                 </div>
                               </div>
                             </div>

                             {/* Namespaces */}
                             {debugResult.namespaces && Object.keys(debugResult.namespaces).length > 0 && (
                               <div>
                                 <h3 className="font-semibold mb-3">XML Namespaces</h3>
                                 <div className="text-sm space-y-1">
                                   {Object.entries(debugResult.namespaces).map(([prefix, uri]: [string, any]) => (
                                     <div key={prefix}>
                                       <code className="bg-muted px-1 rounded">{prefix}:</code> {uri}
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             )}

                             {/* Detected Fields */}
                             <div>
                               <h3 className="font-semibold mb-3">Detected Fields ({debugResult.allFields?.length})</h3>
                               <div className="flex flex-wrap gap-2">
                                 {debugResult.allFields?.map((field: string) => (
                                   <Badge key={field} variant="outline" className="text-xs">
                                     {field}
                                   </Badge>
                                 ))}
                               </div>
                             </div>

                             {/* Suggested Mapping */}
                             <div>
                               <div className="flex items-center justify-between mb-3">
                                 <h3 className="font-semibold">Suggested Field Mapping</h3>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => {
                                     navigator.clipboard.writeText(JSON.stringify(debugResult.mappingConfigSuggestion, null, 2));
                                     toast({
                                       title: "Mapping copied to clipboard",
                                       description: "You can paste this into the mapping configuration"
                                     });
                                   }}
                                 >
                                   <Copy className="w-4 h-4 mr-1" />
                                   Copy Config
                                 </Button>
                               </div>
                               <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{JSON.stringify(debugResult.mappingConfigSuggestion, null, 2)}
                               </pre>
                             </div>

                             <Separator />

                             {/* Sample Products */}
                             <div>
                               <h3 className="font-semibold mb-3">Sample Products</h3>
                               <div className="space-y-4">
                                 {debugResult.firstProductXml && (
                                   <div>
                                     <h4 className="text-sm font-medium mb-2">First Product:</h4>
                                     <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
{debugResult.firstProductXml}
                                     </pre>
                                   </div>
                                 )}
                                 {debugResult.secondProductXml && (
                                   <div>
                                     <h4 className="text-sm font-medium mb-2">Second Product:</h4>
                                     <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
{debugResult.secondProductXml}
                                     </pre>
                                   </div>
                                 )}
                               </div>
                             </div>
                           </div>
                         </ScrollArea>
                       )}
                     </DialogContent>
                   </Dialog>
                    <Button size="sm" variant="outline" onClick={() => editFeed(feed)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete XML Feed</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{feed.name}"? This will deactivate the feed and preserve all import history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteFeed(feed.id, feed.name)}>
                            Delete Feed
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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