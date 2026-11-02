import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/pages/employees";

export const Route = createFileRoute("/_layout/employees")({
  component: EmployeesPage,
});

