import { createFileRoute } from "@tanstack/react-router";
import { MyQrPage } from "@/pages/my-qr";

export const Route = createFileRoute("/_layout/my-qr")({
  component: MyQrPage,
});

