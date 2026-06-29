import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { alerts as initialAlerts } from "@/data/mock-data";

export interface User {
    id: string;
    email: string;
    role: "admin" | "client";
    name?: string;
}

interface AuthResponse {
    error: Error | null;
}

interface SystemContextType {
    user: User | null;
    loadingAuth: boolean;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<AuthResponse>;
    signUp: (email: string, password: string, name: string) => Promise<AuthResponse>;
    // Real-time states from Supabase
    inventory: any[];
    loadingInventory: boolean;
    refreshInventory: () => Promise<void>;
    
    employees: any[];
    loadingEmployees: boolean;
    refreshEmployees: () => Promise<void>;
    
    payroll: any[];
    loadingPayroll: boolean;
    refreshPayroll: () => Promise<void>;
    
    expenses: any[];
    loadingExpenses: boolean;
    refreshExpenses: () => Promise<void>;
    
    sales: any[];
    loadingSales: boolean;
    refreshSales: () => Promise<void>;
    
    alerts: any[];
    setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
    
    processSale: (cart: any[]) => Promise<void>;
    upsertEmployee: (employee: any) => Promise<void>;
    upsertPayroll: (payrollItem: any) => Promise<void>;
    addExpense: (expense: any) => Promise<void>;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(true);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [payroll, setPayroll] = useState<any[]>([]);
    const [loadingPayroll, setLoadingPayroll] = useState(true);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [sales, setSales] = useState<any[]>([]);
    const [loadingSales, setLoadingSales] = useState(true);
    const [alerts, setAlerts] = useState(initialAlerts);

    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout de conexión (10s). Revisa tus llaves de Supabase.")), timeoutMs)
            ),
        ]);
    };

    useEffect(() => {
        // Initialization
        const getSession = async () => {
            try {
                const { data: { session } } = await withTimeout(supabase.auth.getSession());
                if (session) {
                    await fetchProfile(session.user.id, session.user.email!);
                } else {
                    setLoadingAuth(false);
                }
            } catch (err) {
                console.error("Auth init error:", err);
                setLoadingAuth(false);
            }
        };

        const init = async () => {
            await getSession();
            // Inventory is public data; admin data loads after auth in fetchProfile
            await refreshInventory();
        };

        init();

        // Public realtime: inventory only (products are public catalog data)
        const inventoryChannel = supabase.channel('inventory-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshInventory())
            .subscribe();

        // Auth state listener
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await fetchProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setLoadingAuth(false);
            }
        });

        return () => {
            authSub.unsubscribe();
            supabase.removeChannel(inventoryChannel);
        };
    }, []);

    const fetchProfile = async (userId: string, email: string) => {
        try {
            const { data, error }: any = await withTimeout(
                Promise.resolve(
                    supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .single()
                )
            );
            
            if (error && error.code !== 'PGRST116') {
               console.error("Error fetching profile:", error);
            }

            const role: "admin" | "client" = data?.role === "admin" ? "admin" : "client";
            setUser({
                id: userId,
                email: email,
                role,
                name: data?.full_name
            });

            // Load admin-only data after authentication
            if (role === "admin") {
                await Promise.all([
                    refreshEmployees(),
                    refreshPayroll(),
                    refreshExpenses(),
                    refreshSales(),
                ]);
            }
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoadingAuth(false);
        }
    };

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        setLoadingAuth(true);
        try {
            const { data, error }: any = await withTimeout(Promise.resolve(supabase.auth.signInWithPassword({ email, password })));
            if (error) {
                setLoadingAuth(false);
                return { error };
            }

            if (data?.user) {
                await fetchProfile(data.user.id, data.user.email!);
            }

            return { error: null };
        } catch (err: any) {
            setLoadingAuth(false);
            return { error: err };
        }
    };

    const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
        try {
            // Profile is created automatically by the handle_new_user DB trigger.
            // full_name is passed via user_metadata only for the trigger to read it;
            // it is NOT used for authorization decisions (role comes from DB, not metadata).
            const { error }: any = await withTimeout(Promise.resolve(supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name }
                }
            })));
            return { error: error || null };
        } catch (err: any) {
            console.error("SignUp error:", err);
            return { error: err };
        }
    };

    const refreshInventory = async () => {
        setLoadingInventory(true);
        try {
            const { data, error } = await withTimeout(
                Promise.resolve(supabase.from('products').select('*').order('name'))
            );
            if (error) throw error;
            setInventory(data || []);
        } catch (error) {
            console.error("Error refreshing inventory:", error);
        } finally {
            setLoadingInventory(false);
        }
    };

    const refreshEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const { data, error } = await supabase.from('employees').select('*').order('name');
            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const refreshPayroll = async () => {
        setLoadingPayroll(true);
        try {
            const { data, error } = await supabase.from('payroll').select('*').order('period', { ascending: false });
            if (error) throw error;
            setPayroll(data || []);
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoadingPayroll(false);
        }
    };

    const refreshExpenses = async () => {
        setLoadingExpenses(true);
        try {
            const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
            if (error) throw error;
            setExpenses(data || []);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoadingExpenses(false);
        }
    };

    const refreshSales = async () => {
        setLoadingSales(true);
        try {
            const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoadingSales(false);
        }
    };

    const logout = async (): Promise<AuthResponse> => {
        try {
            const { error }: any = await withTimeout(Promise.resolve(supabase.auth.signOut()));
            return { error: error || null };
        } catch (err: any) {
             return { error: err };
        }
    };

    const processSale = async (cart: any[]) => {
        try {
            // 1. Record the sale
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const { data: sale, error: saleError } = await supabase.from('sales').insert([{
                total_amount: totalAmount,
                items: JSON.stringify(cart),
                status: 'completed',
                created_by: user?.id ?? null,
            }]).select().single();

            if (saleError) throw saleError;

            // 2. Update stock
            const updatePromises = cart.map(item => {
                const currentProduct = inventory.find(p => p.id === item.id);
                const newStock = Math.max(0, (currentProduct?.stock || 0) - item.quantity);
                return supabase.from('products').update({ stock: newStock }).eq('id', item.id);
            });

            await Promise.all(updatePromises);
            
            // Re-fetch handled by realtime channel, but manual refresh for speed
            await refreshInventory();
        } catch (err) {
            console.error("Failed to process sale:", err);
            throw err;
        }
    };

    const upsertEmployee = async (employee: any) => {
        try {
            const { error } = await supabase.from('employees').upsert([employee]);
            if (error) throw error;
            await refreshEmployees();
        } catch (err) {
            console.error("Error upserting employee:", err);
            throw err;
        }
    };

    const upsertPayroll = async (payrollItem: any) => {
        try {
            const { error } = await supabase.from('payroll').upsert([payrollItem]);
            if (error) throw error;
            await refreshPayroll();
        } catch (err) {
            console.error("Error upserting payroll:", err);
            throw err;
        }
    };

    const addExpense = async (expense: any) => {
        try {
            const { error } = await supabase.from('expenses').insert([expense]);
            if (error) throw error;
            await refreshExpenses();
        } catch (err) {
            console.error("Error adding expense:", err);
            throw err;
        }
    };

    return (
        <SystemContext.Provider value={{
            user, loadingAuth, login, logout, signUp,
            inventory, loadingInventory, refreshInventory,
            employees, loadingEmployees, refreshEmployees,
            payroll, loadingPayroll, refreshPayroll,
            expenses, loadingExpenses, refreshExpenses,
            sales, loadingSales, refreshSales,
            alerts, setAlerts,
            processSale, upsertEmployee, upsertPayroll, addExpense
        }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (!context) throw new Error("useSystem must be used within SystemProvider");
    return context;
};
