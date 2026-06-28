import { Sparkles } from "lucide-react";

import { INVENTORY, type InventoryRow } from "@/data/inventory";
import { computeMetrics, formatCurrency, formatSignedCurrency } from "@/lib/metrics";

const pct = (fraction: number | null) =>
  fraction === null ? "—" : `${Math.round(fraction * 100)}%`;

/**
 * The single most useful thing on the page: the finding, stated in one line,
 * derived live from the inventory. Leads with the answer (analyst habit) and is
 * scannable in two seconds (UX habit).
 */
export function InsightBar({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const m = computeMetrics(rows);
  const unmappedShare = m.currentTotal > 0 ? m.unmappedSpend / m.currentTotal : 0;

  return (
    <div className="rounded-xl border bg-card p-4 ring-1 ring-foreground/5 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Key finding
          </p>
          <p className="text-sm leading-relaxed text-balance sm:text-base">
            Just <strong className="font-semibold">3 line items</strong> drive{" "}
            <strong className="font-semibold text-rose-600 dark:text-rose-400">
              {pct(m.top3MoverShare)} of the {formatSignedCurrency(m.surgeAbs)} surge
            </strong>{" "}
            — and{" "}
            <strong className="font-semibold text-rose-600 dark:text-rose-400">
              {pct(unmappedShare)} of all spend ({formatCurrency(m.unmappedSpend)})
              has no recorded owner.
            </strong>{" "}
            Meanwhile{" "}
            <strong className="font-semibold text-rose-600 dark:text-rose-400">
              {m.failingCount} failing automations burn {formatCurrency(m.failingSpend)}/mo
            </strong>{" "}
            on work that never lands. Left unchecked, this pace annualizes to a{" "}
            <strong className="font-semibold">
              {formatCurrency(m.annualizedRunRate)}/yr
            </strong>{" "}
            run-rate. The fix is attribution and reliability, then a handful of reversible
            levers — not a spend freeze.
          </p>
          <p className="text-xs text-muted-foreground">
            Derived live from the inventory below · illustrative figures — the schema,
            method, and exports are production-ready.
          </p>
        </div>
      </div>
    </div>
  );
}
