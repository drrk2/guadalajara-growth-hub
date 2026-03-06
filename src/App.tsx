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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="gastos" element={<GastosPage />} />
            <Route path="nominas" element={<NominasPage />} />
            <Route path="inventario" element={<InventarioPage />} />
            <Route path="alertas" element={<AlertasPage />} />
            <Route path="analitica" element={<AnaliticaPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
