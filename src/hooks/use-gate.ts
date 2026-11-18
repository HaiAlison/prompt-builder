import { useMemo } from "react";
import { gateService, type GateListParams } from "@/services/gate.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "@/hooks/use-async";
import type { GateStation } from "@/types";
import type { FilterOption } from "@/components/common/filter-select";

export interface UseGateParams extends GateListParams {
  includeAll?: boolean;
  allLabel?: string;
  formatLabel?: (gate: GateStation) => string;
}

export function useGate(params: UseGateParams = {}) {
  const {
    q,
    factoryId,
    status,
    includeAll = false,
    allLabel = "All gates",
    formatLabel,
  } = params;

  const { version } = useAppState();

  const {
    data,
    loading,
    error,
    reload,
  } = useAsync(
    () => gateService.list({ q, factoryId, status }),
    [q, factoryId, status, version],
  );

  const gates: GateStation[] = useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data as any)?.results ?? [];
  }, [data]);

  const options = useMemo<FilterOption[]>(() => {
    const list: FilterOption[] = gates.map((g) => ({
      value: g.id,
      label: formatLabel
        ? formatLabel(g)
        : g.code
        ? `${g.code} · ${g.name}`
        : `${g.id} · ${g.name}`,
    }));

    if (includeAll) {
      return [{ value: "ALL", label: allLabel }, ...list];
    }
    return list;
  }, [gates, formatLabel, includeAll, allLabel]);

  return {
    gates,
    options,
    loading,
    error,
    reload,
  };
}
