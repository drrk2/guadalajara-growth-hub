import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useSystem } from "./SystemContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isLoading: boolean;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_KEY = "eisen_cart_guest";

const readLocalGuest = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const mergeItems = (base: CartItem[], overlay: CartItem[]): CartItem[] => {
  const merged = [...base];
  for (const item of overlay) {
    const existing = merged.find(i => i.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useSystem();
  const { toast } = useToast();
  const [items, setItems]         = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track whether the initial load for the current user has completed.
  // Prevents premature saves before the load finishes.
  const loadingRef = useRef(true);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load cart on user change ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    loadingRef.current = true;
    setIsLoading(true);

    const load = async () => {
      if (user) {
        // Authenticated: load from DB, then merge any pending guest items
        let dbItems: CartItem[] = [];
        const { data } = await supabase
          .from("client_carts")
          .select("items")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.items) dbItems = data.items as CartItem[];

        const guest   = readLocalGuest();
        const merged  = guest.length > 0 ? mergeItems(dbItems, guest) : dbItems;

        // Clear guest so the next user can't inherit it
        localStorage.removeItem(GUEST_KEY);

        if (!cancelled) {
          setItems(merged);
          loadingRef.current = false;
          setIsLoading(false);
        }
      } else {
        // Anonymous: use localStorage guest key
        if (!cancelled) {
          setItems(readLocalGuest());
          loadingRef.current = false;
          setIsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ── Persist on every change ──────────────────────────────────────────────

  useEffect(() => {
    if (loadingRef.current) return;

    if (user) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        supabase
          .from("client_carts")
          .upsert({ user_id: user.id, items }, { onConflict: "user_id" })
          .then(({ error }) => {
            if (error) console.error("Error saving cart:", error.message);
          });
      }, 600);
    } else {
      localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    }

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // ── Cart operations ──────────────────────────────────────────────────────

  const addItem = (newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const qty = newItem.quantity ?? 1;
    setItems(prev => {
      const existing = prev.find(i => i.id === newItem.id);
      if (existing) {
        return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...newItem, quantity: qty }];
    });
    toast({ title: "Elemento agregado", description: `${newItem.name} se añadió al carrito.` });
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { removeItem(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  };

  const clearCart = () => {
    setItems([]);
    if (!user) localStorage.removeItem(GUEST_KEY);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, isLoading, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
