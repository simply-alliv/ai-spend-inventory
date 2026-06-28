import {
  Layers,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DATA_META } from "@/data/inventory";
import {
  computeMetrics,
  formatCurrency,
  formatPercent,
  formatSignedCurrency,
} from "@/lib/metrics";

interface Kpi {
  label: string;
  value: string;
  hint: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

function buildKpis(): Kpi[] {
  const m = computeMetrics();
  const pauses = m.byDecision.pause ?? 0;

  return [
    {
      label: "Total monthly spend",
      value: formatCurrency(m.currentTotal),
      hint: (
        <span className="text-rose-600 dark:text-rose-400">
          {formatSignedCurrency(m.surgeAbs)} ({formatPercent(m.surgePct)}) vs{" "}
          {DATA_META.priorPeriod}
        </span>
      ),
      icon: Wallet,
      accent: "text-foreground",
    },
    {
      label: "Spend surge",
      value: formatSignedCurrency(m.surgeAbs),
      hint:
        m.top3MoverShare !== null ? (
          <>Top 3 movers = {formatPercent(m.top3MoverShare).replace("+", "")} of it</>
        ) : (
          <>vs prior period</>
        ),
      icon: TrendingUp,
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Line items tracked",
      value: String(m.count),
      hint: (
        <>
          {m.unmappedCount} unmapped · {m.lowConfidenceCount} low-confidence
        </>
      ),
      icon: Layers,
      accent: "text-foreground",
    },
    {
      label: "High-risk items",
      value: String(m.highRiskCount),
      hint: <>triage these first</>,
      icon: ShieldAlert,
      accent: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Needs action",
      value: String(m.needsActionCount),
      hint: <>fix + investigate</>,
      icon: Wrench,
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Pauses so far",
      value: String(pauses),
      hint: <>reversible-first by design</>,
      icon: pauses === 0 ? ShieldCheck : ShieldAlert,
      accent: "text-emerald-600 dark:text-emerald-400",
    },
  ];
}

export function KpiCards() {
  const kpis = buildKpis();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.label} className="gap-0 py-4">
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
