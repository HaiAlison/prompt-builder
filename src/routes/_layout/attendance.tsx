import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "@/pages/attendance";

export const Route = createFileRoute("/_layout/attendance")({
  component: AttendancePage,
});

