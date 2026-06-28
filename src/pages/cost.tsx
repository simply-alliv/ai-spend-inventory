import { PageHeader } from "@/components/layout/page-header";
import {
  SpendBreakdownChart,
  SpendTrendChart,
  SurfaceTrendChart,
  TopMoversChart,
} from "@/components/charts";
import { InventoryTable } from "@/components/inventory-table";
import { KpiCards } from "@/components/kpi-cards";
import { useScopedRows } from "@/hooks/use-auth";

export function CostPage() {
  const rows = useScopedRows();

  return (
    <>
      <PageHeader
        title="Cost & attribution"
        description="Where the money goes, what moved versus last period, and who owns each line."
      />
      <KpiCards rows={rows} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendTrendChart rows={rows} />
        </div>
        <SpendBreakdownChart rows={rows} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopMoversChart rows={rows} />
        <SurfaceTrendChart rows={rows} />
      </div>
      <InventoryTable data={rows} defaultView="cost" />
    </>
  );
}
