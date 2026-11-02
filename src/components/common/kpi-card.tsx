import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  loading?: boolean;
}

const TONE_ICON: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
  loading,
}: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span
          className={cn("flex h-8 w-8 items-center justify-center rounded-md", TONE_ICON[tone])}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
