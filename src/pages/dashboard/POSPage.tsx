import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystem } from "@/context/SystemContext";
import { useToast } from "@/hooks/use-toast";

const formatMoney = (n: number) => `$${n.toLocaleString("es-MX")}`;

const POSPage = () => {
    const { toast } = useToast();
    const { inventory, processSale } = useSystem();
    const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleCheckout = (method: string) => {
        if (method === 'Tarjeta') {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                completeCheckout('Tarjeta');
            }, 3000);
        } else {
            completeCheckout('Efectivo');
        }
    };

    const completeCheckout = (method: string) => {
        processSale(cart);
        toast({
            title: "¡Venta Completada!",
            description: `Monto: ${formatMoney(total)} con ${method}. Inventario actualizado.`,
            className: "bg-success text-white border-0"
        });
        setCart([]);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {isProcessing && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center">
                    <Card className="w-80 p-8 text-center space-y-4 shadow-2xl border-primary/20 animate-pulse">
                        <CreditCard className="h-16 w-16 mx-auto text-primary animate-bounce" />
                        <h2 className="text-xl font-bold">Procesando Tarjeta</h2>
                        <p className="text-sm text-muted-foreground">Conectando con la terminal bancaria...</p>
                        <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                            <div className="bg-primary h-full animate-[progress_3s_ease-in-out]" style={{ width: '100%' }}></div>
                        </div>
                    </Card>
                </div>
            )}
            {/* Product Selection */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-display font-bold">Punto de Venta (POS)</h1>
                    <p className="text-sm text-muted-foreground">{inventory.length} productos en catálogo</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
                    {inventory.map((p) => (
                        <Card key={p.id} className="cursor-pointer hover:border-sidebar-primary transition-all active:scale-95 bg-card/40 backdrop-blur-sm" onClick={() => addToCart(p)}>
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className="h-12 w-full rounded-md overflow-hidden bg-muted mb-2 border shrink-0">
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                </div>
                                <p className="text-xs font-semibold line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                                <p className="text-sidebar-primary font-bold mt-1">{formatMoney(p.price)}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Stock: {Math.round(p.stock)}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Cart / Summary */}
            <Card className="flex flex-col h-full shadow-elevated border-sidebar-border bg-card/60 backdrop-blur-md">
                <CardHeader className="border-b bg-muted/30">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5" /> Tu Carrito
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <ShoppingCart className="h-12 w-12 opacity-10 mb-4" />
                            <p className="text-sm">No hay productos en la orden</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-sidebar-border">
                            {cart.map((item) => (
                                <div key={item.id} className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                                    <div className="flex justify-between font-medium text-sm">
                                        <span className="truncate pr-2">{item.name}</span>
                                        <span className="shrink-0">{formatMoney(item.price * item.quantity)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 bg-muted/40 rounded-full px-2 py-0.5">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="p-6 border-t bg-muted/30 space-y-4">
                    <div className="flex justify-between text-xl font-bold font-display">
                        <span>Total</span>
                        <span className="text-secondary">{formatMoney(total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pb-2">
                        <Button className="gap-2 h-14 font-semibold shadow-md active:scale-95" onClick={() => handleCheckout('Efectivo')} disabled={cart.length === 0}>
                            <Banknote className="h-5 w-5" /> Efectivo
                        </Button>
                        <Button variant="secondary" className="gap-2 h-14 font-semibold shadow-md active:scale-95" onClick={() => handleCheckout('Tarjeta')} disabled={cart.length === 0}>
                            <CreditCard className="h-5 w-5" /> Tarjeta
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default POSPage;
