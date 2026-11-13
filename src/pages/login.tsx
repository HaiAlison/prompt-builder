import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Lock, Mail, AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authService, AuthApiError } from "@/services/auth.service";
import { useAppState } from "@/store/app-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAppState();

  const [email, setEmail] = useState("admin@tmc.com");
  const [password, setPassword] = useState("Admin123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({
        email: trimmedEmail,
        password,
      });

      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);

      if (response.user.role === "EMPLOYEE") {
        navigate({ to: "/my-qr" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      if (err instanceof AuthApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  function fillPreset(presetEmail: string, presetPass: string) {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage(null);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            TMC Manufacturing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Attendance & Access Control System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5 space-y-1">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Sign in to your account
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your corporate credentials to continue
            </p>
          </div>

          {errorMessage && (
            <Alert variant="destructive" className="mb-5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-xs font-semibold">Authentication failed</AlertTitle>
              <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@tmc.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" aria-label="Password" className="text-xs font-medium">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 text-sm" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick fill presets */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Default credentials for testing:</span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillPreset("admin@tmc.com", "string")}
                className="flex flex-col items-start rounded-md border bg-muted/40 p-2 text-left transition hover:bg-muted"
              >
                <span className="text-[11px] font-semibold text-foreground">Admin Account</span>
                <span className="truncate text-[10px] text-muted-foreground">admin@tmc.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillPreset("giang.do@tmc.com.vn", "admin123")}
                className="flex flex-col items-start rounded-md border bg-muted/40 p-2 text-left transition hover:bg-muted"
              >
                <span className="text-[11px] font-semibold text-foreground">Employee Account</span>
                <span className="truncate text-[10px] text-muted-foreground">giang.do@tmc.com.vn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground">
          Protected by TMC Security & Access Control
        </p>
      </div>
    </div>
  );
}

