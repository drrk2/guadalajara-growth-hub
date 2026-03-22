import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import GastosPage from "./pages/dashboard/GastosPage";
import NominasPage from "./pages/dashboard/NominasPage";
import InventarioPage from "./pages/dashboard/InventarioPage";
import AlertasPage from "./pages/dashboard/AlertasPage";
import AnaliticaPage from "./pages/dashboard/AnaliticaPage";
import CRMPage from "./pages/dashboard/CRMPage";
import POSPage from "./pages/dashboard/POSPage";
import ChatWidget from "./components/ChatWidget";
import { SystemProvider, useSystem } from "./context/SystemContext";
import { CartProvider } from "./context/CartContext";

const queryClient = new QueryClient();

// Security Guard: Check if user is "logged in" and has the right role
const RequireAuth = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loadingAuth } = useSystem();
  const location = useLocation();

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Prevent clients from accessing the dashboard at all
  if (user.role === "client" && location.pathname.startsWith("/dashboard")) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SystemProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ChatWidget />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardLayout />
                  </RequireAuth>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="gastos" element={<RequireAuth allowedRoles={["admin"]}><GastosPage /></RequireAuth>} />
                <Route path="nominas" element={<RequireAuth allowedRoles={["admin"]}><NominasPage /></RequireAuth>} />
                <Route path="inventario" element={<InventarioPage />} />
                <Route path="alertas" element={<AlertasPage />} />
                <Route path="analitica" element={<RequireAuth allowedRoles={["admin"]}><AnaliticaPage /></RequireAuth>} />
                <Route path="crm" element={<RequireAuth allowedRoles={["admin"]}><CRMPage /></RequireAuth>} />
                <Route path="pos" element={<POSPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </SystemProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
