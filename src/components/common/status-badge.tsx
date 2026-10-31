import { cn } from "@/lib/utils";
import type {
  AttendanceStatus,
  DenialReason,
  EmploymentStatus,
  EventType,
  GateStatus,
  GateType,
  NetworkStatus,
  QrStatus,
  ReportStatus,
  TransactionStatus,
} from "@/types";
import {
  ATTENDANCE_STATUS_LABEL,
  DENIAL_REASON_LABEL,
  EMPLOYMENT_STATUS_LABEL,
  EVENT_TYPE_LABEL,
  GATE_STATUS_LABEL,
  GATE_TYPE_LABEL,
  QR_STATUS_LABEL,
  TRANSACTION_STATUS_LABEL,
} from "@/utils/format";

export type BadgeTone = "success" | "info" | "warning" | "destructive" | "muted" | "navy";

const TONE_CLASS: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success border-success/25",
  info: "bg-info/10 text-info border-info/25",
  warning: "bg-warning/12 text-warning border-warning/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/25",
  muted: "bg-muted text-muted-foreground border-border",
  navy: "bg-primary/10 text-primary border-primary/25",
};

export function StatusBadge({ tone, label, className }: { tone: BadgeTone; label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

const ATTENDANCE_TONE: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: "success",
  LATE: "warning",
  ABSENT: "destructive",
  ON_LEAVE: "info",
  INCOMPLETE: "muted",
};

export const AttendanceBadge = ({ status }: { status: AttendanceStatus }) => (
  <StatusBadge tone={ATTENDANCE_TONE[status]} label={ATTENDANCE_STATUS_LABEL[status]} />
);

const TX_TONE: Record<TransactionStatus, BadgeTone> = {
  SUCCESS: "success",
  DENIED: "destructive",
  PENDING: "warning",
  FAILED: "destructive",
};

export const TransactionBadge = ({ status }: { status: TransactionStatus }) => (
  <StatusBadge tone={TX_TONE[status]} label={TRANSACTION_STATUS_LABEL[status]} />
);

const QR_TONE: Record<QrStatus, BadgeTone> = {
  ACTIVE: "success",
  EXPIRED: "warning",
  REVOKED: "destructive",
  SUSPENDED: "muted",
};

export const QrBadge = ({ status }: { status: QrStatus }) => (
  <StatusBadge tone={QR_TONE[status]} label={QR_STATUS_LABEL[status]} />
);

const EMP_TONE: Record<EmploymentStatus, BadgeTone> = {
  ACTIVE: "success",
  PROBATION: "info",
  ON_LEAVE: "warning",
  SUSPENDED: "destructive",
  TERMINATED: "muted",
};

export const EmploymentBadge = ({ status }: { status: EmploymentStatus }) => (
  <StatusBadge tone={EMP_TONE[status]} label={EMPLOYMENT_STATUS_LABEL[status]} />
);

const GATE_TONE: Record<GateStatus, BadgeTone> = {
  ONLINE: "success",
  OFFLINE: "destructive",
  MAINTENANCE: "warning",
};

export const GateBadge = ({ status }: { status: GateStatus }) => (
  <StatusBadge tone={GATE_TONE[status]} label={GATE_STATUS_LABEL[status]} />
);

export const GateTypeBadge = ({ type }: { type: GateType }) => (
  <StatusBadge tone="navy" label={GATE_TYPE_LABEL[type]} />
);

export const EventTypeBadge = ({ type }: { type: EventType }) => (
  <StatusBadge tone={type === "CHECK_IN" ? "info" : "navy"} label={EVENT_TYPE_LABEL[type]} />
);

export const NetworkBadge = ({ status }: { status: NetworkStatus }) => (
  <StatusBadge
    tone={status === "ONLINE" ? "success" : status === "RECONNECTING" ? "warning" : "destructive"}
    label={status.charAt(0) + status.slice(1).toLowerCase()}
  />
);

export const DenialBadge = ({ reason }: { reason: DenialReason }) => (
  <StatusBadge tone="destructive" label={DENIAL_REASON_LABEL[reason]} />
);

const REPORT_TONE: Record<ReportStatus, BadgeTone> = {
  NOT_GENERATED: "muted",
  GENERATING: "info",
  COMPLETED: "success",
  FAILED: "destructive",
};

export const ReportBadge = ({ status }: { status: ReportStatus }) => (
  <StatusBadge tone={REPORT_TONE[status]} label={status.replace("_", " ").charAt(0) + status.replace("_", " ").slice(1).toLowerCase()} />
);
