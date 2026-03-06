import {
  LayoutDashboard, DollarSign, Users, Package, Bell, BarChart3, LogOut, ChevronLeft
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { tenant } from "@/data/mock-data";
import { alerts } from "@/data/mock-data";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Gastos", url: "/dashboard/gastos", icon: DollarSign },
  { title: "Nóminas", url: "/dashboard/nominas", icon: Users },
  { title: "Inventario", url: "/dashboard/inventario", icon: Package },
  { title: "Alertas", url: "/dashboard/alertas", icon: Bell },
  { title: "Analítica", url: "/dashboard/analitica", icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tenant.logo}</span>
          {!collapsed && <span className="font-display font-bold text-sm truncate">{tenant.name}</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                      {!collapsed && item.title === "Alertas" && unreadAlerts > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs h-5 px-1.5">
                          {unreadAlerts}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => navigate("/")}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Cerrar Sesión"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
