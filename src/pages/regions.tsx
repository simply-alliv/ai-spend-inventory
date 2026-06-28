import { PageHeader } from "@/components/layout/page-header";
import { RollupView } from "@/components/rollup-view";
import type { InventoryRow } from "@/data/inventory";
import { useScopedRows } from "@/hooks/use-auth";

const byRegion = (row: InventoryRow) => row.region;

export function RegionsPage() {
  const rows = useScopedRows();

  return (
    <>
      <PageHeader
        title="Regions"
        description="The same estate sliced by region, so a regional owner can see their AI footprint end to end."
      />
      <RollupView
        rows={rows}
        keyOf={byRegion}
        columnLabel="Region"
        title="Spend & health by region"
        description="Sorted by monthly spend. Δ, unmapped, failing/degraded, and blended success per region."
      />
    </>
  );
}
