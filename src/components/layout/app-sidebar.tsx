import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  QrCode,
  Smartphone,
  ClipboardList,
  DoorOpen,
  BarChart3,
  ScrollText,
  Settings2,
  Building2,
  ChevronsUpDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ModuleKey } from "@/types";
import { useAppState } from "@/store/app-state";
import { ROLE_BY_NAME } from "@/mocks/users";

interface NavItem {
  module: ModuleKey;
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { module: "dashboard", title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { module: "attendance", title: "Attendance", url: "/attendance", icon: ClipboardList },
      { module: "gates", title: "Gate Stations", url: "/gates", icon: DoorOpen },
    ],
  },
  {
    label: "Management",
    items: [
      { module: "employees", title: "Employees", url: "/employees", icon: Users },
      { module: "qr-codes", title: "QR Code Management", url: "/qr-codes", icon: QrCode },
      { module: "reports", title: "Reports", url: "/reports", icon: BarChart3 },
      { module: "audit-logs", title: "Audit Logs", url: "/audit-logs", icon: ScrollText },
      { module: "settings", title: "System Settings", url: "/settings", icon: Settings2 },
    ],
  },
  {
    label: "Personal",
    items: [{ module: "my-qr", title: "My QR Code", url: "/my-qr", icon: Smartphone }],
  },
];

export function AppSidebar() {
  const { user } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = ROLE_BY_NAME.get(user.role);

  function isActive(url: string) {
    return pathname === url || pathname.startsWith(url + "/");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden rounded-md px-1 py-0.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-tight text-sidebar-foreground">
              TMC Manufacturing
            </span>
            <span className="block truncate text-[11px] leading-tight text-sidebar-foreground/60">
              Attendance & Access Control
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-1 px-2 py-3">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => role?.permissions.includes(i.module));
          if (items.length === 0) return null;
          return (
            <Collapsible key={section.label} defaultOpen>
              <SidebarGroup>
                <CollapsibleTrigger className="group/label flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/80">
                  {section.label}
                  <ChevronsUpDown className="h-3 w-3 opacity-50 transition-transform group-data-[state=open]/label:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((item) => (
                        <SidebarMenuItem key={item.module}>
                          <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                            <Link to={item.url}>
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
