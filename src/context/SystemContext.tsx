import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
    products as initialProducts,
    employees as initialEmployees,
    alerts as initialAlerts,
    payroll as initialPayroll
} from "@/data/mock-data";

export interface User {
    id: string;
    email: string;
    role: "admin" | "employee" | "client";
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
    // Real products state from Supabase
    inventory: any[];
    loadingInventory: boolean;
    refreshInventory: () => Promise<void>;
    employees: any[];
    setEmployees: React.Dispatch<React.SetStateAction<any[]>>;
    payroll: any[];
    setPayroll: React.Dispatch<React.SetStateAction<any[]>>;
    alerts: any[];
    setAlerts: React.Dispatch<React.SetStateAction<any[]>>;
    processSale: (cart: any[]) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loadingInventory, setLoadingInventory] = useState(true);
    const [employees, setEmployees] = useState(initialEmployees);
    const [payroll, setPayroll] = useState(initialPayroll);
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
            await refreshInventory();
        };

        init();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                await fetchProfile(session.user.id, session.user.email!);
            } else {
                setUser(null);
                setLoadingAuth(false);
            }
        });

        return () => subscription.unsubscribe();
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

            // Defaults to 'client' if profile doesn't exist yet
            setUser({
                id: userId,
                email: email,
                role: data?.role || "client",
                name: data?.full_name
            });
            console.log(`[AUTH DIAGNOSTIC] Perfil cargado. Rol asignado: ${data?.role || "client"}`);
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
                // Wait for the profile to be fetched before finishing the login process
                await fetchProfile(data.user.id, data.user.email!);
                console.log(`[AUTH DIAGNOSTIC] Login exitoso. Usuario: ${data.user.email}`);
            }

            return { error: null };
        } catch (err: any) {
            setLoadingAuth(false);
            return { error: err };
        }
    };

    const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
        try {
            const { data, error }: any = await withTimeout(Promise.resolve(supabase.auth.signUp({ 
                email, 
                password,
                options: {
                    data: { full_name: name, role: 'client' }
                }
            })));

            // If successful, create profile entry
            if (!error && data?.user) {
                await withTimeout(Promise.resolve(supabase.from('profiles').insert([
                    { id: data.user.id, full_name: name, role: 'client' }
                ])));
            }
            
            return { error: error || null };
        } catch (err: any) {
            console.error("SignUp Timeout/Network Error:", err);
            return { error: err };
        }
    };

    const refreshInventory = async () => {
        setLoadingInventory(true);
        try {
            const { data, error } = await withTimeout(
                Promise.resolve(supabase.from('products').select('*').order('created_at', { ascending: false }))
            );
            if (error) throw error;
            setInventory(data || []);
        } catch (error) {
            console.error("Error refreshing inventory:", error);
        } finally {
            setLoadingInventory(false);
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
            const updatePromises = cart.map(item => {
                // Determine current stock from our local inventory first
                const currentProduct = inventory.find(p => p.id === item.id);
                const newStock = Math.max(0, (currentProduct?.stock || 0) - item.quantity);
                
                return supabase
                    .from('products')
                    .update({ stock: newStock })
                    .eq('id', item.id);
            });

            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);
            
            if (errors.length > 0) {
                console.error("Errors during stock update:", errors);
            }
            
            // Re-fetch to sync
            await refreshInventory();
        } catch (err) {
            console.error("CRITICAL: Failed to process sale in Supabase:", err);
        }
    };

    return (
        <SystemContext.Provider value={{
            user, loadingAuth, login, logout, signUp,
            inventory, loadingInventory, refreshInventory,
            employees, setEmployees,
            payroll, setPayroll,
            alerts, setAlerts,
            processSale
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
