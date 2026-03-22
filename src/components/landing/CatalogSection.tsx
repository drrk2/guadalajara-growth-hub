import { useState, useEffect } from "react";
import { tenant } from "@/data/mock-data";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, Zap, Wrench, Box, MessageCircle, Info, RefreshCw, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  specs: string; // Store as JSON string in DB
}

const categoryIcons: Record<string, any> = {
  Motores: Settings2,
  Sensores: Zap,
  Mecánica: Wrench,
  Eléctrico: Box,
  Electrónica: Zap,
  Herramientas: Wrench,
};

export function CatalogSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) throw error;
        if (data) setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const parseSpecs = (specsStr: string) => {
    try {
      const parsed = JSON.parse(specsStr);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
      return [specsStr];
    } catch {
      return specsStr ? specsStr.split(',').map(s => s.trim()) : [];
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 bg-[#050505] text-white">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-white/50">Cargando Catálogo EISEN...</p>
      </div>
    );
  }

  return (
    <section id="catalogo" className="py-24 bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block px-4 py-1.5 mb-4 rounded-none bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest skew-x-[-12deg]">
            <span className="skew-x-[12deg] inline-block">Sincronización en Tiempo Real</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight uppercase">Catálogo de Refacciones</h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Explora nuestro inventario de alta precisión alojado en la nube. Máxima disponibilidad para su planta.
          </p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {products.map((product) => (
            <motion.div
              key={product.id}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -12 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="h-full overflow-hidden border-white/5 bg-white/5 backdrop-blur-md transition-all duration-300 hover:shadow-2xl hover:border-primary/50 industrial-shadow group cursor-pointer border-t-2 border-t-transparent hover:border-t-primary rounded-none">
                    <div className="h-60 overflow-hidden relative">
                      {product.image && product.image.startsWith('http') ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" 
                        />
                      ) : (
                        <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center transition-transform duration-700 group-hover:scale-110">
                          <Box className="h-10 w-10 text-white/10 mb-2" />
                          <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Sin Imagen</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-primary hover:bg-primary text-white border-none px-3 py-1 font-bold rounded-none skew-x-[-12deg]">
                          <span className="skew-x-[12deg]">{formatMoney(product.price)}</span>
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">{product.category}</span>
                          <span className="text-[10px] text-white/30 font-mono bg-white/5 px-2 py-0.5 rounded-none italic">#{product.sku}</span>
                        </div>
                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1 uppercase text-white">{product.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardFooter className="pt-0 text-[10px] text-white/40 flex justify-between border-t border-white/5 mt-4 py-4">
                      <div className="flex items-center gap-1">
                        <Box className="h-3 w-3 text-primary" />
                        DISPONIBLE: {product.stock} UN.
                      </div>
                      <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                        DETALLES <Info className="h-3 w-3" />
                      </div>
                    </CardFooter>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-4xl bg-[#0a0a0a] border-white/10 text-white overflow-hidden p-0 rounded-none">
                  <div className={product.image && product.image.startsWith('http') ? "grid md:grid-cols-2 gap-0" : "flex flex-col"}>
                    {product.image && product.image.startsWith('http') && (
                      <div className="aspect-square md:h-full relative overflow-hidden bg-black">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />
                      </div>
                    )}
                    <div className="p-10 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px w-8 bg-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em]">{product.category}</span>
                        </div>
                        <DialogTitle className="text-4xl font-black tracking-tight uppercase leading-tight mb-4">
                          {product.name}
                        </DialogTitle>
                        <p className="text-white/40 text-sm mb-8 font-mono">SKU ID: {product.sku}</p>
                        
                        <div className="space-y-6">
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 mb-4 flex items-center gap-2">
                                ESPECIFICACIONES TÉCNICAS
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {parseSpecs(product.specs).map((spec: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-sm bg-white/5 p-3 border border-white/5 hover:border-primary/30 transition-colors group/item">
                                  <Zap className="h-3.5 w-3.5 text-primary group-hover/item:scale-110 transition-transform" />
                                  <span className="text-white/70">{spec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-12 flex flex-col gap-6">
                        <div className="flex justify-between items-end border-b border-white/10 pb-6">
                            <div>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Precio Unitario</p>
                                <p className="text-3xl font-black text-primary">{formatMoney(product.price)} <span className="text-xs font-normal text-white/20">MXN</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Disponibilidad</p>
                                <p className="text-xl font-bold text-white">{product.stock} UNIDADES</p>
                            </div>
                        </div>
                        <Button 
                          onClick={() => addItem({...product, quantity: 1})}
                          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-16 rounded-none skew-x-[-4deg] transition-all gap-3 shadow-xl shadow-primary/20"
                        >
                          <ShoppingCart className="h-6 w-6" />
                          AÑADIR A COTIZACIÓN
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
        </motion.div>

        {products.length === 0 && !loading && (
          <div className="text-center py-32 border border-dashed border-white/10 rounded-none bg-white/5">
            <RefreshCw className="h-12 w-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/40 uppercase tracking-[0.3em] text-sm">Base de datos vacía o desconectada</p>
            <p className="text-[10px] text-primary mt-4 font-bold">POR FAVOR, SINCRONICE DESDE EL PANEL DE ADMINISTRACIÓN</p>
          </div>
        )}
      </div>
    </section>
  );
}
