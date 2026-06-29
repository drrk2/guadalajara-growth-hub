import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertsProvider, useAlertsContext } from "@/context/AlertsContext";

// Inner component so it can consume AlertsContext provided by DashboardLayout
function DashboardInner() {
  const { count } = useAlertsContext();
  const navigate  = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground font-medium">Panel de Administración</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/dashboard/alertas")}
                title="Ver alertas"
              >
                <Bell className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                TP
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-muted/30 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout() {
  return (
    <AlertsProvider>
      <DashboardInner />
    </AlertsProvider>
  );
}
