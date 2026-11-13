import { createFileRoute, redirect } from "@tanstack/react-router";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();
      if (!token || !user) {
        throw redirect({
          to: "/login",
        });
      }
      throw redirect({
        to: user.role === "EMPLOYEE" ? "/my-qr" : "/dashboard",
      });
    }
  },
  component: () => null,
});
