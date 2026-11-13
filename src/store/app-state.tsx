import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FactoryFilter, NetworkStatus, SystemUser } from "@/types";
import { subscribeDataChanges } from "@/services/bus";
import { authService } from "@/services/auth.service";

interface AppState {
  /** Global factory scope applied to the dashboard and data tables. */
  factoryFilter: FactoryFilter;
  setFactoryFilter: (f: FactoryFilter) => void;
  /** Currently signed in user. Null when unauthenticated. */
  user: SystemUser | null;
  setUser: (u: SystemUser | null) => void;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  network: NetworkStatus;
  setNetwork: (n: NetworkStatus) => void;
  /** Bumped whenever services mutate data, so pages can refetch. */
  version: number;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [factoryFilter, setFactoryFilter] = useState<FactoryFilter>("ALL");
  const [user, setUser] = useState<SystemUser | null>(() => authService.getStoredUser());
  const [network, setNetwork] = useState<NetworkStatus>("ONLINE");
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeDataChanges(() => setVersion((v) => v + 1)), []);

  const refreshProfile = useCallback(async () => {
    const token = authService.getStoredToken();
    if (!token) return;
    try {
      const me = await authService.getMe();
      setUser({
        id: me.id,
        name: me.name,
        email: me.email,
        role: me.role,
        status: me.status,
        linkedEmployeeId: me.linkedEmployeeId ?? undefined,
        lastLogin: new Date().toISOString(),
      });
    } catch {
      // If profile fetch fails due to expired refresh, user gets reset
      setUser(authService.getStoredUser());
    }
  }, []);

  // Fetch updated profile on mount if token is present
  useEffect(() => {
    if (authService.getStoredToken()) {
      refreshProfile();
    }
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user && authService.getStoredToken());

  const value = useMemo<AppState>(
    () => ({
      factoryFilter,
      setFactoryFilter,
      user,
      setUser,
      isAuthenticated,
      logout,
      refreshProfile,
      network,
      setNetwork,
      version,
    }),
    [factoryFilter, user, isAuthenticated, logout, refreshProfile, network, version],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

export function useFactoryScope() {
  const { factoryFilter } = useAppState();
  return factoryFilter;
}
