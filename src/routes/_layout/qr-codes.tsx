import { createFileRoute } from "@tanstack/react-router";
import { QrCodesPage } from "@/pages/qr-codes";

export const Route = createFileRoute("/_layout/qr-codes")({
  component: QrCodesPage,
});

