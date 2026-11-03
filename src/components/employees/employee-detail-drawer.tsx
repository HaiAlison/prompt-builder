import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmployeeAvatar } from "@/components/common/employee-avatar";
import {
  AttendanceBadge,
  EmploymentBadge,
  EventTypeBadge,
  QrBadge,
  TransactionBadge,
} from "@/components/common/status-badge";
import QRCodeReact from "react-qr-code";
import { employeeService, type EmployeeRow } from "@/services/employee.service";
import { attendanceService } from "@/services/attendance.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import {
  EMPLOYMENT_STATUS_LABEL,
  QR_STATUS_LABEL,
  formatDateTime,
  formatDate,
  formatDuration,
  formatTime,
} from "@/utils/format";

interface Props {
  employee: EmployeeRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function EmployeeDetailDrawer({ employee, open, onOpenChange }: Props) {
  const { version } = useAppState();
  const detail = useAsync(
    () => (employee ? employeeService.getById(employee.id) : Promise.resolve(undefined)),
    [employee?.id, open, version],
  );
  const events = useAsync(
    () => (employee ? attendanceService.listTransactions({ q: employee.id }) : Promise.resolve([])),
    [employee?.id, open, version],
  );

  const emp = detail.data?.employee;
  const qr = detail.data?.qrCode ?? null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-xl overflow-hidden p-0 sm:max-w-xl">
        {employee && emp && (
          <>
            <SheetHeader className="px-6 pb-4 pt-6">
              <div className="flex items-center gap-3">
                <EmployeeAvatar name={emp.fullName} className="h-12 w-12 text-base" />
                <div>
                  <SheetTitle className="text-base">{emp.fullName}</SheetTitle>
                  <SheetDescription className="text-xs">
                    {emp.id} · {emp.departmentName} · {emp.position}
                  </SheetDescription>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <EmploymentBadge status={emp.employmentStatus} />
                  {qr && <QrBadge status={qr.status} />}
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="profile" className="flex min-h-0 flex-1 flex-col px-6">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="events">Access Events</TabsTrigger>
              </TabsList>

              <ScrollArea className="mt-4 max-h-[60vh] pr-3">
                <TabsContent value="profile" className="mt-0">
                  <InfoBlock title="Personal information">
                    <Info label="Employee ID" value={emp.id} />
                    <Info label="Gender" value={emp.gender === "M" ? "Male" : "Female"} />
                    <Info label="Date of birth" value={formatDate(emp.dateOfBirth)} />
                    <Info label="Email" value={emp.email} />
                    <Info label="Phone" value={emp.phone} />
                  </InfoBlock>
                  <Separator className="my-4" />
                  <InfoBlock title="Employment information">
                    <Info
                      label="Factory"
                      value={emp.factoryId === "BD" ? "Binh Duong" : "Long An"}
                    />
                    <Info label="Department" value={emp.departmentName} />
                    <Info label="Position" value={emp.position} />
                    <Info label="Status" value={EMPLOYMENT_STATUS_LABEL[emp.employmentStatus]} />
                    <Info label="Hire date" value={formatDate(emp.hireDate)} />
                  </InfoBlock>
                </TabsContent>

                <TabsContent value="qr" className="mt-0">
                  {qr ? (
                    <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-4">
                      <div className="rounded-lg bg-white p-3">
                        <QRCodeReact value={qr.payload} size={128} />
                      </div>
                      <InfoBlock title={qr.id} className="w-full">
                        <Info label="Status" value={<QrBadge status={qr.status} />} />
                        <Info label="Created" value={formatDate(qr.createdAt)} />
                        <Info label="Expires" value={formatDate(qr.expiresAt)} />
                        <Info
                          label="Last used"
                          value={qr.lastUsedAt ? formatDateTime(qr.lastUsedAt) : "Never"}
                        />
                        <Info
                          label="Payload"
                          value={<span className="font-mono text-xs">{qr.payload}</span>}
                        />
                      </InfoBlock>
                      <p className="text-center text-xs text-muted-foreground">
                        The payload is an opaque rotating token — no employee data is embedded in
                        the QR code.
                      </p>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No QR code issued yet for this employee.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="attendance" className="mt-0">
                  <div className="divide-y rounded-lg border">
                    {(detail.data?.attendanceHistory ?? []).map((s) => (
                      <div key={s.date} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">
                          {formatDate(s.date)}
                        </span>
                        <span className="w-24">
                          {s.firstCheckIn ? formatTime(s.firstCheckIn) : "—"} →{" "}
                          {s.lastCheckOut ? formatTime(s.lastCheckOut) : "—"}
                        </span>
                        <span className="w-16 text-xs text-muted-foreground">
                          {formatDuration(s.workedMinutes)}
                        </span>
                        <span className="ml-auto">
                          <AttendanceBadge status={s.status} />
                        </span>
                      </div>
                    ))}
                    {(detail.data?.attendanceHistory ?? []).length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No attendance history.
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  <div className="divide-y rounded-lg border">
                    {(events.data ?? []).slice(0, 30).map((tx) => (
                      <div key={tx.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                        <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">
                          {formatDateTime(tx.timestamp)}
                        </span>
                        <EventTypeBadge type={tx.eventType} />
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {tx.gateName}
                        </span>
                        <TransactionBadge status={tx.status} />
                      </div>
                    ))}
                    {(events.data ?? []).length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No access events recorded.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
