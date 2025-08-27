
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import CategoryListing from "./pages/CategoryListing";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import { Admin } from "./pages/Admin";
import { Auth } from "./pages/Auth";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { useMarket } from "./hooks/useMarket";

const queryClient = new QueryClient();

const AppContent = () => {
  const { market } = useMarket();
  
  // Update HTML lang attribute when market changes
  useEffect(() => {
    document.documentElement.lang = market.locale.split('-')[0];
  }, [market.locale]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/c/:categorySlug" element={<CategoryListing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireAdmin>
            <Admin />
          </ProtectedRoute>
        } 
      />
      
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
