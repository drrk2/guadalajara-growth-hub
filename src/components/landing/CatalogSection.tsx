import { products, tenant } from "@/data/mock-data";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings2, Zap, Wrench, Box, MessageCircle, Info } from "lucide-react";

const categoryIcons: Record<string, any> = {
  Motores: Settings2,
  Sensores: Zap,
  Mecánica: Wrench,
  Eléctrico: Box,
  Electrónica: Zap,
  Herramientas: Wrench,
};

export function CatalogSection() {
  const handleQuote = (productName: string) => {
    const message = encodeURIComponent(`Hola, me interesa cotizar el siguiente producto: ${productName}`);
    window.open(`https://wa.me/${tenant.whatsapp}?text=${message}`, "_blank");
  };

  return (
    <section id="catalogo" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Catálogo de Refacciones</h2>
          <p className="text-muted-foreground">
            Disponemos de un amplio stock de componentes industriales. 
            Haz clic en cualquier producto para ver especificaciones y cotizar directamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, i) => {
            const Icon = categoryIcons[product.category] || Box;
            return (
              <Dialog key={product.id}>
                <DialogTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="cursor-pointer"
                  >
                    <Card className="h-full hover:shadow-xl transition-all border-primary/10 overflow-hidden group">
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                            {product.sku}
                          </Badge>
                          <Icon className="h-4 w-4 text-primary/60" />
                        </div>
                        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
                          {product.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {product.category}
                          </Badge>
                          <Badge variant={product.stock > 10 ? "secondary" : "outline"} className="text-[10px]">
                            {product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
                          </Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between items-center border-t bg-muted/20 p-4">
                        <span className="text-lg font-bold text-primary">
                          ${product.price.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">MXN</span>
                        </span>
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                          <Info className="h-3 w-3" /> Detalles
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{product.sku}</Badge>
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    </div>
                    <DialogTitle className="text-2xl font-display">{product.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="aspect-video w-full rounded-lg overflow-hidden border shadow-inner">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Especificaciones Técnicas</h4>
                      <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed border">
                        {product.specs || "No hay especificaciones adicionales disponibles para este producto."}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div>
                        <p className="text-xs text-muted-foreground">Precio de Lista</p>
                        <p className="text-2xl font-bold text-primary">${product.price.toLocaleString()} MXN</p>
                      </div>
                      <Badge variant={product.stock > 5 ? "secondary" : "outline"} className="px-3 py-1">
                        {product.stock > 0 ? `${product.stock} unidades disponibles` : "Consultar Disponibilidad"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white border-none py-6 text-lg font-semibold"
                      onClick={() => handleQuote(product.name)}
                    >
                      <MessageCircle className="h-5 w-5" /> Cotizar por WhatsApp
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </div>
    </section>
  );
}
