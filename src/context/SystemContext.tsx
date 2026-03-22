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
    // Keep mock data for pages not yet migrated
    inventory: any[];
    setInventory: React.Dispatch<React.SetStateAction<any[]>>;
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
    
    // Mock States for unmigrated components
    const [inventory, setInventory] = useState(initialProducts);
    const [employees, setEmployees] = useState(initialEmployees);
    const [payroll, setPayroll] = useState(initialPayroll);
    const [alerts, setAlerts] = useState(initialAlerts);

    useEffect(() => {
        // Initialization
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                await fetchProfile(session.user.id, session.user.email!);
            } else {
                setLoadingAuth(false);
            }
        };

        getSession();

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
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            
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
        } catch (err) {
            console.error("Profile fetch error:", err);
        } finally {
            setLoadingAuth(false);
        }
    };

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
        const { data, error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
                data: { full_name: name, role: 'client' }
            }
        });

        // If successful, create profile entry
        if (!error && data.user) {
            await supabase.from('profiles').insert([
                { id: data.user.id, full_name: name, role: 'client' }
            ]);
        }
        
        return { error };
    };

    const logout = async (): Promise<AuthResponse> => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    const processSale = (cart: any[]) => {
        setInventory(prev => {
            const newInventory = JSON.parse(JSON.stringify(prev));
            cart.forEach(item => {
                const product = newInventory.find((p: any) => p.id === item.id);
                if (product) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                }
            });
            return newInventory;
        });
    };

    return (
        <SystemContext.Provider value={{
            user, loadingAuth, login, logout, signUp,
            inventory, setInventory,
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
