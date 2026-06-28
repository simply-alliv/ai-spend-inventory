import {
  Activity,
  Banknote,
  CalendarClock,
  ServerCrash,
  ShieldAlert,
  UserCheck,
  Wallet,
  Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DATA_META, INVENTORY, type InventoryRow } from "@/data/inventory";
import {
  computeMetrics,
  formatCurrency,
  formatPercent,
  formatRate,
  formatSignedCurrency,
} from "@/lib/metrics";

interface Kpi {
  label: string;
  value: string;
  hint: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const ROSE = "text-rose-600 dark:text-rose-400";

function buildKpis(rows: InventoryRow[]): Kpi[] {
  const m = computeMetrics(rows);
  const unmappedShare = m.currentTotal > 0 ? m.unmappedSpend / m.currentTotal : 0;
  const wastedShare = m.currentTotal > 0 ? m.wastedSpend / m.currentTotal : 0;

  return [
    {
      label: "Total monthly spend",
      value: formatCurrency(m.currentTotal),
      hint: (
        <span className={ROSE}>
          {formatSignedCurrency(m.surgeAbs)} ({formatPercent(m.surgePct)}) vs{" "}
          {DATA_META.priorPeriod}
        </span>
      ),
      icon: Wallet,
      accent: "text-foreground",
    },
    {
      label: "Annualized run-rate",
      value: formatCurrency(m.annualizedRunRate),
      hint: (
        <>
          surge adds{" "}
          <span className={ROSE}>{formatSignedCurrency(m.surgeAnnualized)}/yr</span>
        </>
      ),
      icon: CalendarClock,
      accent: "text-foreground",
    },
    {
      label: "Spend attributed",
      value: formatPercent(m.attributedPct).replace("+", ""),
      hint: (
        <span className={ROSE}>
          {formatCurrency(m.unmappedSpend)} ({Math.round(unmappedShare * 100)}%)
          unmapped
        </span>
      ),
      icon: UserCheck,
      accent: "text-foreground",
    },
    {
      label: "Needs action",
      value: String(m.needsActionCount),
      hint: <>fix + investigate · {formatCurrency(m.addressableSpend)}/mo</>,
      icon: Wrench,
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Blended success rate",
      value: formatRate(m.blendedSuccess),
      hint: (
        <span className={ROSE}>
          {formatCurrency(m.wastedSpend)} ({Math.round(wastedShare * 100)}%) on
          failed work
        </span>
      ),
      icon: Activity,
      accent: "text-foreground",
    },
    {
      label: "Failing automations",
      value: String(m.failingCount),
      hint: (
        <span className={ROSE}>
          {formatCurrency(m.failingSpend)}/mo runs through them
        </span>
      ),
      icon: ServerCrash,
      accent: ROSE,
    },
    {
      label: "Spend at risk",
      value: formatCurrency(m.atRiskSpend),
      hint: (
        <>
          {m.failingCount} failing · {m.degradedCount} degraded
        </>
      ),
      icon: ShieldAlert,
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Revenue at risk",
      value: formatCurrency(m.revenueAtRiskSpend),
      hint: <>revenue-critical, not yet healthy</>,
      icon: Banknote,
      accent: ROSE,
    },
  ];
}

export function KpiCards({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const kpis = buildKpis(rows);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            className="gap-0 py-4 transition-shadow hover:shadow-sm"
          >
            <CardContent className="px-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {kpi.label}
                </span>
                <Icon className={cn("size-4 shrink-0", kpi.accent)} />
              </div>
              <div
                className={cn(
                  "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
                  kpi.accent,
                )}
              >
                {kpi.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
