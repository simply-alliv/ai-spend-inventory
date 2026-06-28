import { PageHeader } from "@/components/layout/page-header";
import { ReliabilityScatter, SpendBreakdownChart } from "@/components/charts";
import { InventoryTable } from "@/components/inventory-table";
import { KpiCards } from "@/components/kpi-cards";
import { ReliabilityPanel } from "@/components/reliability-panel";
import { useScopedRows } from "@/hooks/use-auth";

export function ReliabilityPage() {
  const rows = useScopedRows();

  return (
    <>
      <PageHeader
        title="Reliability"
        description="Is it working — or paying for failures? Success rate, latency, and automation health."
      />
      <KpiCards rows={rows} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReliabilityScatter rows={rows} />
        <SpendBreakdownChart rows={rows} />
      </div>
      <ReliabilityPanel rows={rows} />
      <InventoryTable data={rows} defaultView="ops" />
    </>
  );
}
