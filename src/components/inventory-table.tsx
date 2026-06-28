import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import {
  ConfidenceBadge,
  DecisionBadge,
  DeltaIndicator,
  RiskBadge,
  StatusBadge,
} from "@/components/badges";
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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  INVENTORY,
  type Decision,
  type Surface,
} from "@/data/inventory";
import {
  deltaOf,
  formatCurrency,
  RISK_ORDER,
} from "@/lib/metrics";

type SortKey = "cost" | "delta" | "risk";
type SortDir = "asc" | "desc";

const SURFACES: Surface[] = ["OpenAI", "Gemini", "Cloud billing", "Run logs"];
const DECISIONS: Decision[] = ["keep", "fix", "pause", "investigate"];

export function InventoryTable() {
  const [query, setQuery] = useState("");
  const [surface, setSurface] = useState<Surface | "all">("all");
  const [decision, setDecision] = useState<Decision | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = INVENTORY.filter((row) => {
      if (surface !== "all" && row.surface !== surface) return false;
      if (decision !== "all" && row.decision !== decision) return false;
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
      return (deltaOf(a).abs - deltaOf(b).abs) * dir;
    });
  }, [query, surface, decision, sortKey, sortDir]);

  return (
    <div className="space-y-3">
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
        <div className="flex items-center gap-2">
          <Select
            value={surface}
            onValueChange={(v) => setSurface(v as Surface | "all")}
          >
            <SelectTrigger size="sm" className="w-[150px]" aria-label="Filter by surface">
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
          <Select
            value={decision}
            onValueChange={(v) => setDecision(v as Decision | "all")}
          >
            <SelectTrigger size="sm" className="w-[150px]" aria-label="Filter by decision">
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
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-12">ID</TableHead>
              <TableHead>Line item / workflow</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">
                <SortHeader
                  label="Monthly cost"
                  active={sortKey === "cost"}
                  dir={sortDir}
                  onClick={() => toggleSort("cost")}
                  align="right"
                />
              </TableHead>
              <TableHead>
                <SortHeader
                  label="Δ vs prior"
                  active={sortKey === "delta"}
                  dir={sortDir}
                  onClick={() => toggleSort("delta")}
                />
              </TableHead>
              <TableHead>Root cause</TableHead>
              <TableHead>
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
              <TableRow key={row.id} className="align-top">
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
                  <div
                    className={cn(
                      "text-sm",
                      row.owner === "Unmapped" &&
                        "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {row.owner}
                  </div>
                  <div className="mt-1">
                    <ConfidenceBadge confidence={row.confidence} />
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(row.monthlyCost)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <DeltaIndicator row={row} />
                </TableCell>
                <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                  {row.rootCause}
                </TableCell>
                <TableCell>
                  <RiskBadge risk={row.risk} />
                </TableCell>
                <TableCell>
                  <DecisionBadge decision={row.decision} />
                </TableCell>
                <TableCell className="max-w-[200px] text-xs text-muted-foreground">
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
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {rows.length} of {INVENTORY.length} line items · sorted by{" "}
        {sortKey === "cost" ? "monthly cost" : sortKey === "risk" ? "risk" : "Δ vs prior"} (
        {sortDir === "asc" ? "ascending" : "descending"})
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
