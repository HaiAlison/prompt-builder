import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  DoorOpen,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UserCircle2,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAppState } from "@/store/app-state";
import { employeeService } from "@/services/employee.service";
import { GATES } from "@/mocks/gates";
import { MOCK_USERS, NOTIFICATIONS, ROLE_BY_NAME } from "@/mocks/users";
import { NetworkBadge } from "@/components/common/status-badge";
import { relativeTime } from "@/utils/format";
import { useAsync } from "@/hooks/use-async";
import type { FactoryFilter, NetworkStatus } from "@/types";

const FACTORY_OPTIONS: { value: FactoryFilter; label: string }[] = [
  { value: "ALL", label: "All Factories" },
  { value: "BD", label: "Binh Duong" },
  { value: "LA", label: "Long An" },
];

export function AppHeader() {
  const { factoryFilter, setFactoryFilter, user, setUser, network, setNetwork } = useAppState();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set(NOTIFICATIONS.filter((n) => n.read).map((n) => n.id)));

  const employees = useAsync(() => employeeService.list(), []);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return { emps: [], gates: [] };
    const emps = (employees.data ?? [])
      .filter((e) => e.id.toLowerCase().includes(q) || e.fullName.toLowerCase().includes(q))
      .slice(0, 6);
    const gates = GATES.filter(
      (g) => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q),
    ).slice(0, 4);
    return { emps, gates };
  }, [search, employees.data]);

  const unread = NOTIFICATIONS.filter((n) => !readIds.has(n.id)).length;
  const role = ROLE_BY_NAME.get(user.role);

  function logout() {
    toast.success("Signed out (mock authentication)");
    const employeeUser = MOCK_USERS.find((u) => u.role === "EMPLOYEE")!;
    setUser(employeeUser);
    navigate({ to: "/my-qr" });
  }

  const initials = user.name
    .split(" ")
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-card/95 px-4 backdrop-blur">
      <SidebarTrigger className="text-muted-foreground" />
      <Separator orientation="vertical" className="h-6" />

      {/* Factory scope */}
      <Select value={factoryFilter} onValueChange={(v) => setFactoryFilter(v as FactoryFilter)}>
        <SelectTrigger className="h-8 w-[160px] border-none bg-muted/60 shadow-none" aria-label="Factory selector">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FACTORY_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1" />

      {/* Global search */}
      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-48 items-center gap-2 rounded-md bg-muted/60 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted md:w-64"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="truncate">Search employees, gates…</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[380px] p-2">
          <Input
            autoFocus
            placeholder="Search by employee ID, name or gate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <div className="mt-2 max-h-80 overflow-y-auto">
            {search.trim() === "" ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">Type to search across employees and gates.</p>
            ) : results.emps.length === 0 && results.gates.length === 0 ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">No matches for “{search}”.</p>
            ) : (
              <>
                {results.emps.length > 0 && (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Employees</p>
                )}
                {results.emps.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      navigate({ to: "/employees", search: { q: e.id } });
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{e.fullName}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{e.id}</span>
                  </button>
                ))}
                {results.gates.length > 0 && (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Gate stations</p>
                )}
                {results.gates.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      navigate({ to: "/gates/$gateId", params: { gateId: g.id } });
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{g.name}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{g.id}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Network status (simulated) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex h-8 items-center gap-1.5 rounded-md px-2 hover:bg-muted" aria-label="Network status">
            {network === "ONLINE" ? (
              <Wifi className="h-4 w-4 text-success" />
            ) : network === "RECONNECTING" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-warning" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <span className="hidden text-xs font-medium text-muted-foreground lg:inline">{network.charAt(0) + network.slice(1).toLowerCase()}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Simulated gate connectivity
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setNetwork("ONLINE")}>
            <Wifi className="h-4 w-4 text-success" /> Online
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNetwork("RECONNECTING")}>
            <RefreshCw className="h-4 w-4 text-warning" /> Reconnecting
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNetwork("OFFLINE")}>
            <WifiOff className="h-4 w-4 text-destructive" /> Offline
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Switch to Offline to see access transactions queue for synchronization.
          </p>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted" aria-label="Notifications">
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <p className="border-b px-3 py-2 text-sm font-semibold">Notifications</p>
          <div className="max-h-96 overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setReadIds((s) => new Set(s).add(n.id))}
                className="flex w-full flex-col gap-0.5 border-b px-3 py-2.5 text-left last:border-0 hover:bg-accent/60"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {!readIds.has(n.id) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-info" />}
                  {n.title}
                </span>
                <span className="text-xs text-muted-foreground">{n.message}</span>
                <span className="text-[11px] text-muted-foreground/70">{relativeTime(n.time)}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6" />

      {/* User profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted" aria-label="User profile">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block max-w-[140px] truncate text-xs font-semibold leading-tight">{user.name}</span>
              <span className="block text-[11px] leading-tight text-muted-foreground">{role?.label}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs font-normal text-muted-foreground">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserCircle2 className="mr-2 h-4 w-4" /> Switch role (dev)
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {MOCK_USERS.map((u) => (
                <DropdownMenuItem key={u.id} onClick={() => { setUser(u); toast.info(`Now acting as ${u.name} — ${ROLE_BY_NAME.get(u.role)?.label}`); }}>
                  <span className="flex flex-col">
                    <span className="text-sm">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{ROLE_BY_NAME.get(u.role)?.label}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onClick={() => navigate({ to: "/my-qr" })}>
            <Menu className="mr-2 h-4 w-4" /> My QR Code
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
