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
import { Plus, Edit, RefreshCw } from "lucide-react";

interface AffiliateNetwork {
  id: string;
  name: string;
  api_endpoint: string;
  api_key_name: string;
  market_code: string;
  is_active: boolean;
  last_sync_at: string | null;
  config: any;
}

export const NetworkManager = () => {
  const [networks, setNetworks] = useState<AffiliateNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<AffiliateNetwork | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    api_endpoint: "",
    api_key_name: "",
    market_code: "us",
    config: "{}"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadNetworks();
  }, []);

  const loadNetworks = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_networks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      toast({
        title: "Error loading networks",
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
          action: editingNetwork ? 'update_network' : 'create_network',
          data: {
            ...formData,
            config: JSON.parse(formData.config),
            ...(editingNetwork && { id: editingNetwork.id })
          }
        }
      });

      if (error) throw error;

      toast({
        title: `Network ${editingNetwork ? 'updated' : 'created'} successfully`,
      });

      setShowForm(false);
      setEditingNetwork(null);
      setFormData({ name: "", api_endpoint: "", api_key_name: "", market_code: "us", config: "{}" });
      loadNetworks();
    } catch (error) {
      toast({
        title: "Error saving network",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const triggerSync = async (networkId: string) => {
    try {
      const { error } = await supabase.functions.invoke('affiliate-api-sync', {
        body: { network_id: networkId }
      });

      if (error) throw error;

      toast({
        title: "Sync triggered successfully",
        description: "The synchronization process has been started"
      });
    } catch (error) {
      toast({
        title: "Error triggering sync",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const editNetwork = (network: AffiliateNetwork) => {
    setEditingNetwork(network);
    setFormData({
      name: network.name,
      api_endpoint: network.api_endpoint,
      api_key_name: network.api_key_name,
      market_code: network.market_code,
      config: JSON.stringify(network.config, null, 2)
    });
    setShowForm(true);
  };

  if (loading) {
    return <div>Loading networks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Affiliate Networks</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Network
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingNetwork ? 'Edit Network' : 'Add New Network'}</CardTitle>
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
                <Label htmlFor="api_endpoint">API Endpoint</Label>
                <Input
                  id="api_endpoint"
                  type="url"
                  value={formData.api_endpoint}
                  onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="api_key_name">API Key Name</Label>
                <Input
                  id="api_key_name"
                  value={formData.api_key_name}
                  onChange={(e) => setFormData({ ...formData, api_key_name: e.target.value })}
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
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea
                  id="config"
                  value={formData.config}
                  onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingNetwork ? 'Update' : 'Create'} Network
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setEditingNetwork(null);
                  setFormData({ name: "", api_endpoint: "", api_key_name: "", market_code: "us", config: "{}" });
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {networks.map((network) => (
          <Card key={network.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {network.name}
                    <Badge variant={network.is_active ? "default" : "secondary"}>
                      {network.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{network.api_endpoint}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => triggerSync(network.id)}
                    disabled={!network.is_active}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => editNetwork(network)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>API Key: {network.api_key_name}</p>
                <p>Market: {network.market_code}</p>
                {network.last_sync_at && (
                  <p>Last sync: {new Date(network.last_sync_at).toLocaleString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {networks.length === 0 && (
        <Alert>
          <AlertDescription>
            No affiliate networks configured yet. Add your first network to start syncing products.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};