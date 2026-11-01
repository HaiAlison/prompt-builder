import { Outlet, useRouterState, Link } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useAppState } from "@/store/app-state";
import { ROLE_BY_NAME } from "@/mocks/users";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModuleKey } from "@/types";

export function AdminLayout() {
  const { user } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const moduleKey = pathname.split("/").filter(Boolean)[0] as ModuleKey | undefined;
  const role = ROLE_BY_NAME.get(user.role);
  const allowed = moduleKey === "my-qr" || (moduleKey && role?.permissions.includes(moduleKey));

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-background">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6">
          {allowed ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-md py-24 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-7 w-7 text-destructive" />
              </span>
              <h1 className="mt-4 text-lg font-semibold">Access restricted</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The {role?.label} role does not have permission to open the{" "}
                <span className="font-medium text-foreground">{moduleKey ?? "this"}</span> module.
                Switch to a different role from the profile menu to explore it.
              </p>
              <Button asChild className="mt-5" variant="outline">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
