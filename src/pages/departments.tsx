import { PageHeader } from "@/components/layout/page-header";
import { RollupView } from "@/components/rollup-view";
import type { InventoryRow } from "@/data/inventory";
import { useScopedRows } from "@/hooks/use-auth";

const byDepartment = (row: InventoryRow) => row.department;

export function DepartmentsPage() {
  const rows = useScopedRows();

  return (
    <>
      <PageHeader
        title="Departments"
        description="AI spend and health rolled up by owning department — the primary showback dimension. Unmapped is its own row by design: you can't bill what you can't attribute."
      />
      <RollupView
        rows={rows}
        keyOf={byDepartment}
        columnLabel="Department"
        title="Spend & health by department"
        description="Sorted by monthly spend. Δ, unmapped, failing/degraded, and blended success per department."
      />
    </>
  );
}
