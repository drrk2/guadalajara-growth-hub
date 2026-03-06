import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products } from "@/data/mock-data";
import { useToast } from "@/hooks/use-toast";

const POSPage = () => {
    const { toast } = useToast();
    const [cart, setCart] = useState<{ id: string, name: string, price: number, quantity: number }[]>([]);

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
        toast({
            title: "Venta Registrada",
            description: `Venta por $${total.toLocaleString()} pagada con ${method}.`
        });
        setCart([]);
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
            {/* Product Selection */}
            <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-2">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-display font-bold">Venta / POS</h1>
                    <p className="text-sm text-muted-foreground">{products.length} productos disponibles</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {products.map((p) => (
                        <Card key={p.id} className="cursor-pointer hover:border-sidebar-primary transition-colors" onClick={() => addToCart(p)}>
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <span className="text-2xl mb-2">📦</span>
                                <p className="text-xs font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                                <p className="text-sidebar-primary font-bold mt-1">${p.price.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Cart / Summary */}
            <Card className="flex flex-col h-full shadow-elevated">
                <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5" /> Carrito
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <ShoppingCart className="h-12 w-12 opacity-20 mb-4" />
                            <p>Carrito vacío</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {cart.map((item) => (
                                <div key={item.id} className="p-4 space-y-2">
                                    <div className="flex justify-between font-medium text-sm">
                                        <span>{item.name}</span>
                                        <span>${(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
                <div className="p-6 border-t space-y-4">
                    <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span>${total.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button className="gap-2 h-12" onClick={() => handleCheckout('Efectivo')} disabled={cart.length === 0}>
                            <Banknote className="h-4 w-4" /> Efectivo
                        </Button>
                        <Button variant="secondary" className="gap-2 h-12" onClick={() => handleCheckout('Tarjeta')} disabled={cart.length === 0}>
                            <CreditCard className="h-4 w-4" /> Tarjeta
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default POSPage;
