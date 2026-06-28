// The operational triage queue: every automation that isn't healthy, worst
// first. This is the "catch the failure before the invoice does" view — the
// reliability lens the cost table can't show on its own.

import { ArrowRight, Clock, Gauge, Hash, Wallet } from "lucide-react";

import { HealthBadge } from "@/components/badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INVENTORY, type Health, type InventoryRow } from "@/data/inventory";
import {
  computeMetrics,
  costPerCall,
  formatCompact,
  formatCurrency,
  formatLatency,
  formatRate,
  formatUnitCost,
  reliabilityConcerns,
} from "@/lib/metrics";

const BAR_CLASS: Record<Health, string> = {
  healthy: "bg-emerald-500",
  degraded: "bg-amber-500",
  failing: "bg-rose-500",
};

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      <span className="tabular-nums text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function ConcernItem({ row, health }: { row: InventoryRow; health: Health }) {
  const successPct = Math.round(row.successRate * 100);

  return (
    <li className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-mono text-xs">{row.lineItem}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            <span className="rounded bg-muted px-1.5 py-0.5">{row.surface}</span>{" "}
            {row.workflow} · {row.owner}
          </div>
        </div>
        <HealthBadge health={health} />
      </div>

      <div className="mt-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Success rate</span>
          <span className="font-medium tabular-nums">
            {formatRate(row.successRate)}
          </span>
        </div>
        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={successPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full", BAR_CLASS[health])}
            style={{ width: `${successPct}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
        <Metric icon={Clock} label="p95" value={formatLatency(row.latencyMsP95)} />
        <Metric icon={Hash} label="calls" value={formatCompact(row.calls)} />
        <Metric icon={Wallet} label="/mo" value={formatCurrency(row.monthlyCost)} />
        <Metric
          icon={Gauge}
          label="/call"
          value={formatUnitCost(costPerCall(row), 3)}
        />
      </div>

      <p className="mt-2.5 text-xs text-muted-foreground">{row.rootCause}</p>
      <p className="mt-1 flex items-start gap-1 text-xs font-medium text-foreground">
        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
        {row.lever}
      </p>
    </li>
  );
}

export function ReliabilityPanel({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const m = computeMetrics(rows);
  const concerns = reliabilityConcerns(rows);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">Automation health</CardTitle>
            <CardDescription>
              Every automation that isn't healthy, worst first — so a break gets caught
              before the invoice does.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs">
            <span className="text-rose-600 dark:text-rose-400">
              <strong className="tabular-nums">{m.failingCount}</strong> failing
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              <strong className="tabular-nums">{m.degradedCount}</strong> degraded
            </span>
            <span className="text-muted-foreground">
              <strong className="tabular-nums text-foreground">
                {formatCurrency(m.atRiskSpend)}
              </strong>
              /mo at risk
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {concerns.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Every automation is healthy. Nothing to triage.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {concerns.map(({ row, health }) => (
              <ConcernItem key={row.id} row={row} health={health} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
