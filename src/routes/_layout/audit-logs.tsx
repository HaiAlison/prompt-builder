import { createFileRoute } from "@tanstack/react-router";
import { AuditLogsPage } from "@/pages/audit-logs";

export const Route = createFileRoute("/_layout/audit-logs")({
  component: AuditLogsPage,
});

