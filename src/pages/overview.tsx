import { PageHeader } from "@/components/layout/page-header";
import { DashboardCharts } from "@/components/charts";
import { InsightBar } from "@/components/insight-bar";
import { KpiCards } from "@/components/kpi-cards";
import { useScopedRows } from "@/hooks/use-auth";

export function OverviewPage() {
  const rows = useScopedRows();

  return (
    <>
      <PageHeader
        title="Overview"
        description="AI spend and reliability across your scope, at a glance."
      />
      <InsightBar rows={rows} />
      <KpiCards rows={rows} />
      <DashboardCharts rows={rows} />
    </>
  );
}
