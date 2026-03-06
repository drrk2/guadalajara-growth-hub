import React, { createContext, useContext, useState, ReactNode } from "react";
import {
    products as initialProducts,
    employees as initialEmployees,
    alerts as initialAlerts,
    payroll as initialPayroll
} from "@/data/mock-data";

interface SystemContextType {
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
    const [inventory, setInventory] = useState(initialProducts);
    const [employees, setEmployees] = useState(initialEmployees);
    const [payroll, setPayroll] = useState(initialPayroll);
    const [alerts, setAlerts] = useState(initialAlerts);

    const processSale = (cart: any[]) => {
        setInventory(prev => {
            const newInventory = JSON.parse(JSON.stringify(prev)); // Deep clone for safety
            cart.forEach(item => {
                // Find product in inventory
                const product = newInventory.find((p: any) => p.id === item.id);

                // Deduction logic
                if (item.name.toLowerCase().includes("taco")) {
                    const tortillas = newInventory.find((p: any) => p.name.toLowerCase().includes("tortilla"));
                    if (tortillas) tortillas.stock = Math.max(0, tortillas.stock - (item.quantity * 5));
                } else if (product && product.category.toLowerCase().includes("bebida")) {
                    product.stock = Math.max(0, product.stock - item.quantity);
                } else if (product) {
                    // Default deduction
                    product.stock = Math.max(0, product.stock - item.quantity);
                }
            });
            return newInventory;
        });
    };

    return (
        <SystemContext.Provider value={{
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
