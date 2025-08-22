import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMarket } from '@/hooks/useMarket';
import { Plus, Link, Settings, Trash2, Play, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AffiliateNetwork {
  id: string;
  name: string;
  api_endpoint: string;
  api_key_name: string;
  config: any;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export function AffiliateManager() {
  const [networks, setNetworks] = useState<AffiliateNetwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    api_endpoint: '',
    api_key_name: '',
    config: JSON.stringify({
      auth_header: 'Authorization',
      market_param: 'country',
      limit: 100,
      field_mapping: {
        title: 'title',
        description: 'description',
        price: 'price',
        currency: 'currency',
        image_url: 'image_url',
        category: 'category',
        shop: 'merchant',
        affiliate_url: 'link',
        external_id: 'id'
      }
    }, null, 2)
  });
  const { toast } = useToast();
  const { market } = useMarket();

  useEffect(() => {
    fetchNetworks();
  }, [market]);

  const fetchNetworks = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_networks')
        .select('*')
        .eq('market_code', market.code)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error fetching networks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch affiliate networks",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let config;
      try {
        config = JSON.parse(formData.config);
      } catch {
        throw new Error('Invalid JSON in configuration');
      }

      const { error } = await supabase
        .from('affiliate_networks')
        .insert({
          name: formData.name,
          api_endpoint: formData.api_endpoint,
          api_key_name: formData.api_key_name,
          config: config,
          market_code: market.code,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Affiliate network configuration saved successfully",
      });

      setFormData({
        name: '',
        api_endpoint: '',
        api_key_name: '',
        config: JSON.stringify({
          auth_header: 'Authorization',
          market_param: 'country',
          limit: 100,
          field_mapping: {
            title: 'title',
            description: 'description',
            price: 'price',
            currency: 'currency',
            image_url: 'image_url',
            category: 'category',
            shop: 'merchant',
            affiliate_url: 'link',
            external_id: 'id'
          }
        }, null, 2)
      });

      fetchNetworks();
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

  const syncNetwork = async (networkId: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('affiliate-api-sync', {
        body: {
          networkId,
          marketCode: market.code
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      toast({
        title: "Sync Started",
        description: `Processing ${result.productsProcessed} products. ${result.productsCreated} created, ${result.productsUpdated} updated.`,
      });

      fetchNetworks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sync affiliate network",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNetwork = async (networkId: string) => {
    try {
      const { error } = await supabase
        .from('affiliate_networks')
        .delete()
        .eq('id', networkId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Affiliate network deleted successfully",
      });

      fetchNetworks();
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
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Make sure to add your API keys to Supabase secrets before syncing. The API key name should match the "API Key Name" field below.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Affiliate Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Network Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Commission Junction"
                  required
                />
              </div>
              <div>
                <Label htmlFor="api_key_name">API Key Name (in Supabase Secrets)</Label>
                <Input
                  id="api_key_name"
                  value={formData.api_key_name}
                  onChange={(e) => setFormData({ ...formData, api_key_name: e.target.value })}
                  placeholder="e.g., CJ_API_KEY"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="api_endpoint">API Endpoint</Label>
              <Input
                id="api_endpoint"
                type="url"
                value={formData.api_endpoint}
                onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                placeholder="https://api.example.com/products"
                required
              />
            </div>

            <div>
              <Label htmlFor="config">Network Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                rows={12}
                className="font-mono text-sm"
                placeholder="Network configuration..."
              />
              <p className="text-sm text-muted-foreground mt-1">
                Configure API parameters and field mappings for this network
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Network Configuration'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Affiliate Networks ({networks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {networks.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No affiliate networks configured yet
            </p>
          ) : (
            <div className="space-y-4">
              {networks.map((network) => (
                <div key={network.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{network.name}</h3>
                      <Badge variant={network.is_active ? "default" : "secondary"}>
                        {network.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => syncNetwork(network.id)}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNetwork(network.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{network.api_endpoint}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    API Key: {network.api_key_name}
                  </p>
                  {network.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      Last synced: {new Date(network.last_sync_at).toLocaleString()}
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