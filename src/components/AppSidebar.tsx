import { Link, useRouterState } from "@tanstack/react-router";
import { Ship, Upload, History, Anchor } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Nova análise", url: "/", icon: Upload },
  { title: "Histórico", url: "/historico", icon: History },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="overflow-hidden border-b border-sidebar-border">
        <div className={`flex items-center gap-2 overflow-hidden py-3 ${collapsed ? "justify-center px-0" : "px-2"}`}>
          <div className={`grid shrink-0 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30 ${collapsed ? "h-8 w-8" : "h-9 w-9"}`}>
            <Ship className={collapsed ? "h-4 w-4" : "h-5 w-5"} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
                NexusCargo
              </div>
              <div className="truncate text-[10px] uppercase text-muted-foreground">
                Manifest Intelligence
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="overflow-hidden border-t border-sidebar-border">
        <div className={`flex items-center gap-2 overflow-hidden py-2 text-xs text-muted-foreground ${collapsed ? "justify-center px-0" : "px-2"}`}>
          <Anchor className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span className="truncate">v1.0 · Ancorado</span>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
