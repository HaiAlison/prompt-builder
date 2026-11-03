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
import { MOCK_USERS } from "@/mocks/users";
import { subscribeDataChanges } from "@/services/bus";

interface AppState {
  /** Global factory scope applied to the dashboard and data tables. */
  factoryFilter: FactoryFilter;
  setFactoryFilter: (f: FactoryFilter) => void;
  /** Currently "signed in" mock user; switchable for role-based testing. */
  user: SystemUser;
  setUser: (u: SystemUser) => void;
  network: NetworkStatus;
  setNetwork: (n: NetworkStatus) => void;
  /** Bumped whenever mock services mutate data, so pages can refetch. */
  version: number;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [factoryFilter, setFactoryFilter] = useState<FactoryFilter>("ALL");
  const [user, setUser] = useState<SystemUser>(MOCK_USERS[0]!);
  const [network, setNetwork] = useState<NetworkStatus>("ONLINE");
  const [version, setVersion] = useState(0);

  useEffect(() => subscribeDataChanges(() => setVersion((v) => v + 1)), []);

  const value = useMemo<AppState>(
    () => ({ factoryFilter, setFactoryFilter, user, setUser, network, setNetwork, version }),
    [factoryFilter, user, network, version],
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
