import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

import { SystemProvider } from "./context/SystemContext";
import { Navigate, useLocation } from "react-router-dom";

const queryClient = new QueryClient();

// Security Guard: Check if user is "logged in" (mock)
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem("is_auth") === "true";
  const location = useLocation();
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SystemProvider>
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
              <Route path="gastos" element={<GastosPage />} />
              <Route path="nominas" element={<NominasPage />} />
              <Route path="inventario" element={<InventarioPage />} />
              <Route path="alertas" element={<AlertasPage />} />
              <Route path="analitica" element={<AnaliticaPage />} />
              <Route path="crm" element={<CRMPage />} />
              <Route path="pos" element={<POSPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SystemProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
