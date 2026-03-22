import React from "react";
import {
  LayoutDashboard, DollarSign, Users, Package, Bell, BarChart, LogOut, FileText, ShoppingCart, User, Zap
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

import { useSystem } from "@/context/SystemContext";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ventas / POS", url: "/dashboard/pos", icon: ShoppingCart },
  { title: "CRM / Clientes", url: "/dashboard/crm", icon: User, protected: true },
  { title: "Gastos", url: "/dashboard/gastos", icon: DollarSign, protected: true },
  { title: "Nóminas", url: "/dashboard/nominas", icon: Users, protected: true },
  { title: "Inventario", url: "/dashboard/inventario", icon: Package },
  { title: "Alertas", url: "/dashboard/alertas", icon: Bell },
  { title: "Analítica", url: "/dashboard/analitica", icon: BarChart, protected: true },
];

export function AppSidebar() {
  const { user, logout } = useSystem();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const unreadAlerts = alerts.filter(a => !a.read).length;

  // Filter items based on user role
  const filteredItems = menuItems.filter(item => {
    if (item.protected && user?.role !== "admin") return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <span className="text-xl">{tenant.logo}</span>
          </div>
          {!collapsed && <span className="font-display font-bold text-sm truncate">{tenant.name}</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
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
                          {unreadAlerts.toString()}
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
        <div className="px-2 py-2 mb-2 text-[10px] text-muted-foreground uppercase tracking-widest border-t border-sidebar-border pt-4">
          Sesión: {user?.role}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Cerrar Sesión"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
