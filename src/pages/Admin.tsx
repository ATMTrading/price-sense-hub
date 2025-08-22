import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedManager } from "@/components/Admin/FeedManager";
import { NetworkManager } from "@/components/Admin/NetworkManager";
import { ImportLogs } from "@/components/Admin/ImportLogs";
import { ProductManager } from "@/components/Admin/ProductManager";

export const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="feeds" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="feeds">XML Feeds</TabsTrigger>
            <TabsTrigger value="networks">Affiliate Networks</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="logs">Import Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="feeds" className="mt-6">
            <FeedManager />
          </TabsContent>

          <TabsContent value="networks" className="mt-6">
            <NetworkManager />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductManager />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <ImportLogs />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};