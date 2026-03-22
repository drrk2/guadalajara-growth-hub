import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { products } from "@/data/mock-data";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SyncDataButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setLoading(true);
    try {
      // 1. Prepare products for Supabase
      const productsToSync = products.map(p => ({
        name: p.name,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        category: p.category,
        image: p.image,
        specs: JSON.stringify(p.specs),
        min_stock: p.minStock
      }));

      // 2. Upsert to Supabase
      const { error } = await supabase
        .from('products')
        .upsert(productsToSync, { onConflict: 'sku' });

      if (error) throw error;

      toast({
        title: "Sincronización Exitosa",
        description: `${products.length} productos han sido actualizados en Supabase.`,
      });
    } catch (error: any) {
      console.error("Sync error:", error);
      toast({
        variant: "destructive",
        title: "Error de Sincronización",
        description: error.message || "No se pudo conectar con Supabase.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={loading}
      variant="outline"
      className="gap-2 border-primary/20 hover:border-primary/50 transition-all"
    >
      {loading ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4 text-primary" />
      )}
      Sincronizar con Supabase
    </Button>
  );
}
