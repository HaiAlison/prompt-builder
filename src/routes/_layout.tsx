import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/admin-layout";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/_layout")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined") {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();
      if (!token || !user) {
        throw redirect({
          to: "/login",
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
  component: AdminLayout,
});
