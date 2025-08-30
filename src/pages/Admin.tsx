import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Footer } from "@/components/Layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FeedManager } from "@/components/Admin/FeedManager";
import { NetworkManager } from "@/components/Admin/NetworkManager";
import { ImportLogs } from "@/components/Admin/ImportLogs";
import { ProductManager } from "@/components/Admin/ProductManager";
import { ScheduleManager } from "@/components/Admin/ScheduleManager";
import { CategoryImport } from "@/components/Admin/CategoryImport";
import { UniversalImport } from "@/components/Admin/UniversalImport";
import { AuditLogs } from "@/components/Admin/AuditLogs";
import { triggerXMLImport } from '@/utils/importTrigger';

export const Admin = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="feeds">XML Feeds</TabsTrigger>
            <TabsTrigger value="networks">Networks</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="audit">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-6">
            <div className="space-y-6">
              <div className="flex gap-4 mb-6">
                <Button 
                  onClick={async () => {
                    console.log('🚀 Triggering XML import...');
                    const result = await triggerXMLImport('277034c8-3836-4410-bdc5-b1602d50195a');
                    if (result.success) {
                      console.log('✅ Import triggered successfully');
                    } else {
                      console.error('❌ Import failed:', result.error);
                    }
                  }}
                  variant="outline"
                >
                  🔄 Restore Products (XML Import)
                </Button>
              </div>
              <UniversalImport />
              <CategoryImport />
            </div>
          </TabsContent>

          <TabsContent value="feeds" className="mt-6">
            <FeedManager />
          </TabsContent>

          <TabsContent value="networks" className="mt-6">
            <NetworkManager />
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <ScheduleManager />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductManager />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <ImportLogs />
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <AuditLogs />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};