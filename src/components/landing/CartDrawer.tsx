import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, Plus, Minus, Send } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  const handleWhatsAppCheckout = () => {
    if (items.length === 0) return;
    
    let message = "*Nueva Cotización - EISEN*\n\n";
    items.forEach(item => {
      message += `- *${item.sku}* | ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*Subtotal Estimado:* $${totalPrice.toFixed(2)}`;
    
    // Replace with actual business WhatsApp number
    const phoneNumber = "523312345678"; 
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-primary transition-colors">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-[#0a0a0a] border-white/10 text-white flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-white/10">
          <SheetTitle className="text-xl font-display font-black text-white text-left uppercase tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Cotización Actual
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-white/40 pt-20">
              <ShoppingCart className="h-16 w-16 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">El carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-20 w-20 bg-white/5 rounded-md overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover mix-blend-screen" />
                    ) : (
                        <div className="text-[10px] text-white/20 font-bold uppercase">Sin Imagen</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-primary mb-1">{item.sku}</p>
                        <h4 className="text-sm font-medium text-white/90 line-clamp-2">{item.name}</h4>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-white/40 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 bg-white/5 rounded-md border border-white/10 p-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-white/60 uppercase tracking-widest font-bold">Subtotal Estimado</span>
              <span className="font-display font-black text-2xl">${totalPrice.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleWhatsAppCheckout}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-none skew-x-[-12deg] transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[45deg]" />
              <span className="skew-x-[12deg] flex items-center justify-center gap-2">
                SOLICITAR COTIZACIÓN FORMAL <Send className="h-4 w-4" />
              </span>
            </Button>
            <p className="text-[10px] text-center text-white/40 mt-4 uppercase tracking-widest">
              Serás redirigido a WhatsApp con un asesor.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
