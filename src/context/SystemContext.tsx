import React, { createContext, useContext, useState, ReactNode } from "react";
import {
    products as initialProducts,
    employees as initialEmployees,
    alerts as initialAlerts,
    payroll as initialPayroll
} from "@/data/mock-data";

interface User {
    email: string;
    role: "admin" | "employee";
}

interface SystemContextType {
    user: User | null;
    login: (email: string, role: "admin" | "employee") => void;
    logout: () => void;
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
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("system_user");
        return saved ? JSON.parse(saved) : null;
    });
    const [inventory, setInventory] = useState(initialProducts);
    const [employees, setEmployees] = useState(initialEmployees);
    const [payroll, setPayroll] = useState(initialPayroll);
    const [alerts, setAlerts] = useState(initialAlerts);

    const login = (email: string, role: "admin" | "employee") => {
        const newUser = { email, role };
        setUser(newUser);
        localStorage.setItem("system_user", JSON.stringify(newUser));
        localStorage.setItem("is_auth", "true");
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("system_user");
        localStorage.removeItem("is_auth");
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
            user, login, logout,
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
