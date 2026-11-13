import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/pages/login";
import { authService } from "@/services/auth.service";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    // If user is already authenticated with a token and user profile, redirect to dashboard
    if (typeof window !== "undefined") {
      const token = authService.getStoredToken();
      const user = authService.getStoredUser();
      if (token && user) {
        throw redirect({
          to: user.role === "EMPLOYEE" ? "/my-qr" : "/dashboard",
        });
      }
    }
  },
  component: LoginPage,
});

