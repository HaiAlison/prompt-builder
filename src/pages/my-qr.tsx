import { useRef, useState } from "react";
import QRCodeReact from "react-qr-code";
import { Download, RefreshCw, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/filter-select";
import { QrBadge } from "@/components/common/status-badge";
import { qrCodeService } from "@/services/qr-code.service";
import { employeeService } from "@/services/employee.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import { downloadQrPng } from "@/utils/qr";
import { formatDate } from "@/utils/format";

export function MyQrPage() {
  const { user, version } = useAppState();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Link to employee
  const employeeId = user.linkedEmployeeId ?? "TMC-BD-0001";
  const employeeQuery = useAsync(() => employeeService.getById(employeeId), [employeeId, version]);
  const qrQuery = useAsync(() => qrCodeService.getByEmployee(employeeId), [employeeId, version]);

  const qr = qrQuery.data;
  const emp = employeeQuery.data;

  async function handleDownload() {
    if (!qr || !svgRef.current) return;
    setDownloading(true);
    try {
      await downloadQrPng(`my-qr-${qr.employeeId}.png`, svgRef.current);
      toast.success("QR code downloaded successfully");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setDownloading(false);
    }
  }

  async function handleRegenerate() {
    if (!qr) return;
    setRefreshing(true);
    try {
      await qrCodeService.regenerate(qr.id);
      toast.success("Personal QR regenerated with new rotating security token");
    } catch {
      toast.error("Failed to regenerate QR code");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 items-center">
      <div className="w-full max-w-md">
        <PageHeader
          title="My QR Code"
          description="Personal access credential for gate turnstiles and time clocks"
        />

        <Card className="mt-4 shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
              <Smartphone className="h-6 w-6" />
            </div>
            <CardTitle>{emp?.fullName ?? user.name}</CardTitle>
            <CardDescription className="text-xs">
              {emp?.id} · {emp?.departmentName ?? "Staff"} ·{" "}
              {emp?.factoryId === "BD" ? "Bình Dương" : "Long An"}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-4 pt-2">
            <div className="rounded-xl border bg-white p-5 shadow-inner">
              <QRCodeReact
                ref={svgRef as never}
                value={qr?.payload ?? "TMC-FALLBACK-TOKEN"}
                size={220}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Status:</span>
              <QrBadge status={qr?.status ?? "ACTIVE"} />
            </div>

            <div className="w-full rounded-lg bg-muted/50 p-3 text-center text-xs text-muted-foreground">
              <p>
                Valid Until:{" "}
                <span className="font-semibold text-foreground">
                  {qr?.expiresAt ? formatDate(qr.expiresAt) : "Never"}
                </span>
              </p>
              <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-emerald-600 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> High security dynamic rotating token
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 border-t pt-4">
            <Button
              className="w-full gap-1.5"
              variant="outline"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-4 w-4" /> Download QR Code Badge
            </Button>
            <Button
              className="w-full gap-1.5"
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Request New
              Token
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
