import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  ConfidenceBadge,
  DecisionBadge,
  DeltaIndicator,
  HealthBadge,
  RiskBadge,
  StatusBadge,
} from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  INVENTORY,
  type Decision,
  type InventoryRow,
  type Risk,
  type Surface,
} from "@/data/inventory";
import {
  costPer1kCalls,
  CRITICALITY_LABEL,
  deltaOf,
  formatCompact,
  formatCurrency,
  formatLatency,
  formatRate,
  formatSignedCurrency,
  formatUnitCost,
  isUnmapped,
  opsHealth,
  RISK_LABEL,
  RISK_ORDER,
  shareOf,
} from "@/lib/metrics";

type SortKey = "cost" | "delta" | "risk" | "calls" | "success" | "latency";
type SortDir = "asc" | "desc";
type View = "cost" | "ops";

const SURFACES: Surface[] = ["OpenAI", "Gemini", "Cloud billing", "Run logs"];
const DECISIONS: Decision[] = ["keep", "fix", "pause", "investigate"];
const RISKS: Risk[] = ["high", "medium", "low"];

const VIEWS: { key: View; label: string }[] = [
  { key: "cost", label: "Cost & attribution" },
  { key: "ops", label: "Reliability & usage" },
];

const COST_SORTS = new Set<SortKey>(["cost", "delta", "risk"]);
const OPS_SORTS = new Set<SortKey>(["cost", "calls", "success", "latency"]);

const SORT_LABEL: Record<SortKey, string> = {
  cost: "monthly cost",
  delta: "Δ vs prior",
  risk: "risk",
  calls: "calls",
  success: "success rate",
  latency: "p95 latency",
};

const ROSE = "text-rose-600 dark:text-rose-400";
const AMBER = "text-amber-600 dark:text-amber-400";

export function InventoryTable({
  data = INVENTORY,
  defaultView = "cost",
}: {
  data?: InventoryRow[];
  defaultView?: View;
}) {
  const [view, setView] = useState<View>(defaultView);
  const [query, setQuery] = useState("");
  const [surface, setSurface] = useState<Surface | "all">("all");
  const [decision, setDecision] = useState<Decision | "all">("all");
  const [risk, setRisk] = useState<Risk | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const hasFilters =
    query.trim() !== "" ||
    surface !== "all" ||
    decision !== "all" ||
    risk !== "all";

  function changeView(next: View) {
    setView(next);
    // Keep the sort meaningful for the columns now on screen.
    if (next === "ops" && !OPS_SORTS.has(sortKey)) {
      setSortKey("calls");
      setSortDir("desc");
    }
    if (next === "cost" && !COST_SORTS.has(sortKey)) {
      setSortKey("delta");
      setSortDir("desc");
    }
  }

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function resetFilters() {
    setQuery("");
    setSurface("all");
    setDecision("all");
    setRisk("all");
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = data.filter((row) => {
      if (surface !== "all" && row.surface !== surface) return false;
      if (decision !== "all" && row.decision !== decision) return false;
      if (risk !== "all" && row.risk !== risk) return false;
      if (!q) return true;
      return [row.id, row.lineItem, row.workflow, row.owner, row.rootCause]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "cost") return (a.monthlyCost - b.monthlyCost) * dir;
      if (sortKey === "risk") return (RISK_ORDER[a.risk] - RISK_ORDER[b.risk]) * -dir;
      if (sortKey === "calls") return (a.calls - b.calls) * dir;
      if (sortKey === "success") return (a.successRate - b.successRate) * dir;
      if (sortKey === "latency") return (a.latencyMsP95 - b.latencyMsP95) * dir;
      return (deltaOf(a).abs - deltaOf(b).abs) * dir;
    });
  }, [query, surface, decision, risk, sortKey, sortDir, data]);

  const totalCost = rows.reduce((s, r) => s + r.monthlyCost, 0);
  const totalDelta = rows.reduce((s, r) => s + deltaOf(r).abs, 0);
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0);
  const totalTokensM = rows.reduce((s, r) => s + (r.tokensM ?? 0), 0);
  const blendedSuccess =
    totalCalls > 0
      ? rows.reduce((s, r) => s + r.successRate * r.calls, 0) / totalCalls
      : null;
  const blendedPer1k = totalCalls > 0 ? (totalCost / totalCalls) * 1000 : null;
  const grandTotal = data.reduce((s, r) => s + r.monthlyCost, 0);

  const ariaSort = (key: SortKey): React.AriaAttributes["aria-sort"] =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex shrink-0 rounded-lg border bg-muted/40 p-0.5 text-xs"
          role="tablist"
          aria-label="Inventory view"
        >
          {VIEWS.map((vw) => (
            <button
              key={vw.key}
              type="button"
              role="tab"
              aria-selected={view === vw.key}
              onClick={() => changeView(vw.key)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                view === vw.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {vw.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {view === "cost"
            ? "Who owns it, what moved, and the reversible lever."
            : "Volume, success rate, latency, and unit cost per call."}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, line item, workflow, owner…"
            className="pl-8"
            aria-label="Search inventory"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={surface} onValueChange={(v) => setSurface(v as Surface | "all")}>
            <SelectTrigger size="sm" className="w-[140px]" aria-label="Filter by surface">
              <SelectValue placeholder="Surface" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surfaces</SelectItem>
              {SURFACES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={decision} onValueChange={(v) => setDecision(v as Decision | "all")}>
            <SelectTrigger size="sm" className="w-[140px]" aria-label="Filter by decision">
              <SelectValue placeholder="Decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All decisions</SelectItem>
              {DECISIONS.map((d) => (
                <SelectItem key={d} value={d} className="capitalize">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={(v) => setRisk(v as Risk | "all")}>
            <SelectTrigger size="sm" className="w-[120px]" aria-label="Filter by risk">
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All risk</SelectItem>
              {RISKS.map((r) => (
                <SelectItem key={r} value={r}>
                  {RISK_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1.5 text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          {view === "cost" ? (
            <>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Line item / workflow</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right" aria-sort={ariaSort("cost")}>
                    <SortHeader
                      label="Monthly cost"
                      active={sortKey === "cost"}
                      dir={sortDir}
                      onClick={() => toggleSort("cost")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead aria-sort={ariaSort("delta")}>
                    <SortHeader
                      label="Δ vs prior"
                      active={sortKey === "delta"}
                      dir={sortDir}
                      onClick={() => toggleSort("delta")}
                    />
                  </TableHead>
                  <TableHead>Root cause</TableHead>
                  <TableHead aria-sort={ariaSort("risk")}>
                    <SortHeader
                      label="Risk"
                      active={sortKey === "risk"}
                      dir={sortDir}
                      onClick={() => toggleSort("risk")}
                    />
                  </TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Lever</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "align-top",
                      row.risk === "high" && "bg-rose-500/[0.04]",
                    )}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.id}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div className="font-mono text-xs">{row.lineItem}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {row.surface}
                        </span>
                        {row.workflow}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      {isUnmapped(row) ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/25 bg-rose-500/10 px-1.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                          <AlertTriangle className="size-3" />
                          Unmapped
                        </span>
                      ) : (
                        <div className="text-sm">{row.owner}</div>
                      )}
                      <div className="mt-1">
                        <ConfidenceBadge confidence={row.confidence} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="font-medium">
                        {formatCurrency(row.monthlyCost)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(shareOf(row.monthlyCost, grandTotal) * 100)}% of
                        spend
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <DeltaIndicator row={row} />
                    </TableCell>
                    <TableCell
                      className="max-w-[220px] text-xs text-muted-foreground"
                      title={row.rootCause}
                    >
                      {row.rootCause}
                    </TableCell>
                    <TableCell>
                      <RiskBadge risk={row.risk} />
                    </TableCell>
                    <TableCell>
                      <DecisionBadge decision={row.decision} />
                    </TableCell>
                    <TableCell
                      className="max-w-[200px] text-xs text-muted-foreground"
                      title={row.lever}
                    >
                      {row.lever}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No line items match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {rows.length > 0 && (
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Total · {rows.length} {rows.length === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="font-semibold">{formatCurrency(totalCost)}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {Math.round(shareOf(totalCost, grandTotal) * 100)}% of spend
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                      {formatSignedCurrency(totalDelta)}
                    </TableCell>
                    <TableCell colSpan={5} />
                  </TableRow>
                </TableFooter>
              )}
            </>
          ) : (
            <>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Line item / workflow</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead className="text-right" aria-sort={ariaSort("calls")}>
                    <SortHeader
                      label="Calls"
                      active={sortKey === "calls"}
                      dir={sortDir}
                      onClick={() => toggleSort("calls")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="text-right" aria-sort={ariaSort("success")}>
                    <SortHeader
                      label="Success"
                      active={sortKey === "success"}
                      dir={sortDir}
                      onClick={() => toggleSort("success")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="text-right" aria-sort={ariaSort("latency")}>
                    <SortHeader
                      label="p95"
                      active={sortKey === "latency"}
                      dir={sortDir}
                      onClick={() => toggleSort("latency")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">$ / 1k calls</TableHead>
                  <TableHead className="text-right" aria-sort={ariaSort("cost")}>
                    <SortHeader
                      label="Monthly cost"
                      active={sortKey === "cost"}
                      dir={sortDir}
                      onClick={() => toggleSort("cost")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead>Criticality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const health = opsHealth(row);
                  const successTone =
                    health === "failing"
                      ? ROSE
                      : health === "degraded"
                        ? AMBER
                        : "text-foreground";
                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "align-top",
                        health === "failing" && "bg-rose-500/[0.04]",
                      )}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.id}
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="font-mono text-xs">{row.lineItem}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="rounded bg-muted px-1.5 py-0.5">
                            {row.surface}
                          </span>
                          {row.workflow}
                        </div>
                      </TableCell>
                      <TableCell>
                        <HealthBadge health={health} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCompact(row.calls)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className={cn("font-medium", successTone)}>
                          {formatRate(row.successRate)}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums",
                          row.latencyMsP95 > 4000 && AMBER,
                        )}
                      >
                        {formatLatency(row.latencyMsP95)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.tokensM === null ? "—" : `${row.tokensM}M`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUnitCost(costPer1kCalls(row))}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(row.monthlyCost)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs",
                            row.criticality === "revenue"
                              ? ROSE
                              : row.criticality === "unknown"
                                ? AMBER
                                : "text-muted-foreground",
                          )}
                        >
                          {CRITICALITY_LABEL[row.criticality]}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No line items match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              {rows.length > 0 && (
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={3}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Total · {rows.length} {rows.length === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCompact(totalCalls)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatRate(blendedSuccess)}
                    </TableCell>
                    <TableCell />
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {totalTokensM}M
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUnitCost(blendedPer1k)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(totalCost)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </>
          )}
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {data.length} line items · sorted by{" "}
        {SORT_LABEL[sortKey]} ({sortDir === "asc" ? "ascending" : "descending"})
      </p>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      <Icon className="size-3.5" />
    </button>
  );
}
