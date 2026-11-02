import { createFileRoute } from "@tanstack/react-router";
import { GateDetailPage } from "@/pages/gate-detail";

export const Route = createFileRoute("/_layout/gates/$gateId")({
  component: GateDetailPage,
});

