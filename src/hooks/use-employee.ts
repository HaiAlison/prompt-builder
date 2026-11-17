import { employeeService } from "@/services/employee.service";
import { useAppState } from "@/store/app-state";
import { useAsync } from "./use-async";

export function useEmployee(id?: string) {
    const { version } = useAppState();

    const {
        data: employees,
        loading,
        error,
        reload,
    } = useAsync(
        () => employeeService.list(),
        [version],
    );

    return { employees, loading, error, reload };
}
