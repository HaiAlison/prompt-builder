import { createFileRoute } from "@tanstack/react-router";
import { GatesPage } from "@/pages/gates";

export const Route = createFileRoute("/_layout/gates/")({
  component: GatesPage,
});

