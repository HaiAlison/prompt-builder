import { useMemo } from "react";
import { useAsync } from "@/hooks/use-async";
import { factoryService } from "@/services/factory.service";
import { useAppState } from "@/store/app-state";
import type { FilterOption } from "@/components/common/filter-select";
import type { Factory } from "@/types";

export interface UseFactoryOptionsParams {
  includeAll?: boolean;
  allLabel?: string;
  formatLabel?: (factory: Factory) => string;
}

export function useFactoryOptions(params: UseFactoryOptionsParams = {}) {
  const { includeAll = true, allLabel = "All factories", formatLabel } = params;
  const { version } = useAppState();

  const {
    data: factories = [],
    loading,
    error,
    reload,
  } = useAsync(() => factoryService.list(), [version]);

  const options = useMemo<FilterOption[]>(() => {
    const list: FilterOption[] = (factories ?? []).map((f) => ({
      value: f.id,
      label: formatLabel
        ? formatLabel(f)
        : f.code
          ? `${f.name} (${f.code})`
          : f.name,
    }));

    if (includeAll) {
      return [{ value: "ALL", label: allLabel }, ...list];
    }
    return list;
  }, [factories, includeAll, allLabel, formatLabel]);

  return {
    options,
    factories: factories ?? [],
    loading,
    error,
    reload,
  };
}
