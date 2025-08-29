import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface BookImportOptions {
  feedId: string;
  categoryIds: string[];
  productsPerCategory: number;
  marketCode: string;
}

interface BookImportResult {
  success: boolean;
  message: string;
  processedCount: number;
  createdCount: number;
}

export const useBookImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const startBookImport = useCallback(async (options: BookImportOptions): Promise<BookImportResult> => {
    setImporting(true);
    setProgress(0);
    
    try {
      // Optimized book import with batch processing
      const { data, error } = await supabase.functions.invoke('process-xml-feed', {
        body: {
          feed_id: options.feedId,
          category_filter: options.categoryIds,
          import_type: 'book_import_optimized',
          products_per_category: options.productsPerCategory,
          market_code: options.marketCode,
          optimization_flags: {
            enable_batch_processing: true,
            cache_categories: true,
            use_book_specific_logic: true,
            google_books_category_filter: "784"
          }
        }
      });

      if (error) throw error;

      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 1000);

      // Clean up progress after completion
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        setImporting(false);
      }, 15000);

      toast({
        title: "Book import started",
        description: `Processing ${options.productsPerCategory} books per category`,
        duration: 5000
      });

      return {
        success: true,
        message: "Book import completed successfully",
        processedCount: data?.processed || 0,
        createdCount: data?.created || 0
      };
      
    } catch (error) {
      setImporting(false);
      setProgress(0);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      toast({
        title: "Book import failed",
        description: errorMessage,
        variant: "destructive"
      });

      return {
        success: false,
        message: errorMessage,
        processedCount: 0,
        createdCount: 0
      };
    }
  }, [toast]);

  const stopImport = useCallback(async () => {
    setImporting(false);
    setProgress(0);
    
    toast({
      title: "Import stopped",
      description: "Book import process has been terminated",
    });
  }, [toast]);

  return {
    importing,
    progress,
    startBookImport,
    stopImport
  };
};