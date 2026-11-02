import { useRef, useState } from "react";
import { Download, QrCode as QrIcon } from "lucide-react";
import { toast } from "sonner";
import QRCodeReact from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrBadge } from "@/components/common/status-badge";
import { downloadQrPng } from "@/utils/qr";
import { formatDate, formatDateTime } from "@/utils/format";
import type { QrCode } from "@/types";

export function QrDetailDialog({ code, open, onOpenChange }: { code: QrCode | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (!code || !svgRef.current) return;
    setDownloading(true);
    try {
      await downloadQrPng(`${code.employeeId}-${code.id}.png`, svgRef.current);
      toast.success("QR code image downloaded");
    } catch {
      toast.error("Could not export the QR image");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrIcon className="h-4 w-4" /> {code?.id}
          </DialogTitle>
          <DialogDescription>QR code detail and preview</DialogDescription>
        </DialogHeader>
        {code && (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-white p-4">
              <QRCodeReact ref={svgRef as never} value={code.payload} size={192} />
            </div>
            <div className="grid w-full grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Detail label="Employee" value={`${code.employeeName} (${code.employeeId})`} />
              <Detail label="Factory" value={code.factoryId === "BD" ? "Binh Duong" : "Long An"} />
              <Detail label="Status" value={<QrBadge status={code.status} />} />
              <Detail label="Created" value={formatDate(code.createdAt)} />
              <Detail label="Expires" value={formatDate(code.expiresAt)} />
              <Detail label="Last used" value={code.lastUsedAt ? formatDateTime(code.lastUsedAt) : "Never"} />
            </div>
            <div className="w-full rounded-md bg-muted/60 p-2">
              <p className="text-xs text-muted-foreground">Payload (opaque token — safe to share with scanners)</p>
              <p className="break-all font-mono text-xs">{code.payload}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={download} disabled={downloading}>
              <Download className="h-4 w-4" /> {downloading ? "Exporting…" : "Download PNG"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
