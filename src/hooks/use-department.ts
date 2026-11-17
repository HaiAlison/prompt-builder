import { useMemo } from "react";
import { useAsync } from "@/hooks/use-async";
import { departmentService } from "@/services/department.service";
import { useAppState } from "@/store/app-state";
import type { FilterOption } from "@/components/common/filter-select";
import type { Department } from "@/types";

export interface UseDepartmentParams {
  factoryId?: string;
  includeAll?: boolean;
  allLabel?: string;
  formatLabel?: (department: Department) => string;
}

export function useDepartment(params: UseDepartmentParams = {}) {
  const {
    factoryId,
    includeAll = true,
    allLabel = "All departments",
    formatLabel,
  } = params;
  const { version } = useAppState();

  const {
    data: allDepartments = [],
    loading,
    error,
    reload,
  } = useAsync(() => departmentService.list(), [version]);

  // Filter departments by factoryId if provided and not "ALL"
  const departments = useMemo(() => {
    if (!factoryId || factoryId === "ALL") {
      return allDepartments ?? [];
    }
    return (allDepartments ?? []).filter((d) => d.factoryId === factoryId);
  }, [allDepartments, factoryId]);

  // Map to select options for FilterSelect / Radix Select
  const options = useMemo<FilterOption[]>(() => {
    const list: FilterOption[] = departments.map((d) => ({
      value: d.id,
      label: formatLabel
        ? formatLabel(d)
        : `${d.name}${!factoryId || factoryId === "ALL" ? (d.factoryCode ? ` (${d.factoryCode})` : d.factoryId ? ` (${d.factoryId})` : "") : ""}`,
    }));

    if (includeAll) {
      return [{ value: "ALL", label: allLabel }, ...list];
    }
    return list;
  }, [departments, factoryId, includeAll, allLabel, formatLabel]);

  return {
    departments,
    allDepartments: allDepartments ?? [],
    options,
    loading,
    error,
    reload,
  };
}

// Alias for consistency with useFactoryOptions
export const useDepartmentOptions = useDepartment;
