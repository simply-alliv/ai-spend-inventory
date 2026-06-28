// Generic spend + reliability rollup table, grouped by any key (department,
// region, …). The spend cell carries an inline bar so the distribution reads at
// a glance — the "more granular data" view for the Organisation pages.

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { InventoryRow } from "@/data/inventory";
import {
  formatCurrency,
  formatRate,
  formatSignedCurrency,
  rollupBy,
  shareOf,
} from "@/lib/metrics";

const ROSE = "text-rose-600 dark:text-rose-400";
const AMBER = "text-amber-600 dark:text-amber-400";
const EMERALD = "text-emerald-600 dark:text-emerald-400";

export function RollupView<K extends string>({
  rows,
  keyOf,
  columnLabel,
  title,
  description,
}: {
  rows: InventoryRow[];
  keyOf: (row: InventoryRow) => K;
  columnLabel: string;
  title: string;
  description: string;
}) {
  const data = rollupBy(rows, keyOf);
  const maxSpend = Math.max(1, ...data.map((d) => d.spend));
  const totalSpend = data.reduce((s, d) => s + d.spend, 0);
  const totalSurge = data.reduce((s, d) => s + d.surge, 0);
  const totalUnmapped = data.reduce((s, d) => s + d.unmappedSpend, 0);
  const totalItems = data.reduce((s, d) => s + d.count, 0);
  const totalCalls = data.reduce((s, d) => s + d.calls, 0);
  const blended =
    totalCalls > 0
      ? data.reduce((s, d) => s + (d.blendedSuccess ?? 0) * d.calls, 0) /
        totalCalls
      : null;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>{columnLabel}</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Monthly spend</TableHead>
                <TableHead className="text-right">Δ vs prior</TableHead>
                <TableHead className="text-right">Unmapped</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Success</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.key}>
                  <TableCell className="font-medium">{d.key}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {d.count}
                  </TableCell>
                  <TableCell>
                    <div className="relative ml-auto w-full max-w-[220px]">
                      <div
                        className="absolute inset-y-0 right-0 rounded bg-primary/10"
                        style={{ width: `${(d.spend / maxSpend) * 100}%` }}
                      />
                      <div className="relative flex items-center justify-end gap-1.5 px-1.5 py-0.5">
                        <span className="font-medium tabular-nums">
                          {formatCurrency(d.spend)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {Math.round(shareOf(d.spend, totalSpend) * 100)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      d.surge > 0 ? ROSE : "text-muted-foreground",
                    )}
                  >
                    {formatSignedCurrency(d.surge)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      d.unmappedSpend > 0 ? ROSE : "text-muted-foreground",
                    )}
                  >
                    {d.unmappedSpend > 0 ? formatCurrency(d.unmappedSpend) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {d.failing === 0 && d.degraded === 0 ? (
                      <span className={EMERALD}>Healthy</span>
                    ) : (
                      <span className="text-muted-foreground">
                        {d.failing > 0 && (
                          <span className={ROSE}>{d.failing} failing</span>
                        )}
                        {d.failing > 0 && d.degraded > 0 && " · "}
                        {d.degraded > 0 && (
                          <span className={AMBER}>{d.degraded} degraded</span>
                        )}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRate(d.blendedSuccess)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell className="text-xs font-medium text-muted-foreground">
                  Total · {totalItems} items
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {totalItems}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(totalSpend)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    totalSurge > 0 ? ROSE : "text-muted-foreground",
                  )}
                >
                  {formatSignedCurrency(totalSurge)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    totalUnmapped > 0 ? ROSE : "text-muted-foreground",
                  )}
                >
                  {totalUnmapped > 0 ? formatCurrency(totalUnmapped) : "—"}
                </TableCell>
                <TableCell />
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatRate(blended)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
