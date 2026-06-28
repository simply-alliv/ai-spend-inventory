// Pure derivations over the inventory: formatters, per-row delta, and the
// aggregate metrics the dashboard renders. Kept framework-free so the same
// functions back both the KPI cards and the exports.

import {
  INVENTORY,
  type Decision,
  type InventoryRow,
  type Risk,
  type Status,
  type Surface,
} from "@/data/inventory";

export type DeltaDirection = "up" | "down" | "flat";

export interface Delta {
  abs: number;
  /** Fractional change vs prior (0.34 = +34%). null when prior is 0. */
  pct: number | null;
  direction: DeltaDirection;
}

export function deltaOf(row: InventoryRow): Delta {
  const abs = row.monthlyCost - row.priorCost;
  const pct = row.priorCost > 0 ? abs / row.priorCost : null;
  const direction: DeltaDirection = abs > 0 ? "up" : abs < 0 ? "down" : "flat";
  return { abs, pct, direction };
}

/** ▲ / ▲▲ / ▲▲▲ magnitude marker, matching the source artifact's shorthand. */
export function deltaMagnitude(row: InventoryRow): string {
  const { pct, direction } = deltaOf(row);
  if (direction === "flat" || pct === null) return "–";
  const arrow = direction === "up" ? "▲" : "▼";
  const m = Math.abs(pct);
  const count = m >= 1 ? 3 : m >= 0.5 ? 2 : 1;
  return arrow.repeat(count);
}

// ---- formatters ---------------------------------------------------------

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

export function formatPercent(fraction: number | null): string {
  if (fraction === null) return "—";
  const sign = fraction > 0 ? "+" : fraction < 0 ? "−" : "";
  return `${sign}${Math.abs(fraction * 100).toFixed(0)}%`;
}

// ---- aggregates ---------------------------------------------------------

function countBy<K extends string>(
  rows: InventoryRow[],
  key: (row: InventoryRow) => K,
): Record<K, number> {
  return rows.reduce(
    (acc, row) => {
      const k = key(row);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {} as Record<K, number>,
  );
}

function sumBy<K extends string>(
  rows: InventoryRow[],
  key: (row: InventoryRow) => K,
  value: (row: InventoryRow) => number,
): Record<K, number> {
  return rows.reduce(
    (acc, row) => {
      const k = key(row);
      acc[k] = (acc[k] ?? 0) + value(row);
      return acc;
    },
    {} as Record<K, number>,
  );
}

const UNMAPPED_OWNERS = new Set(["Unmapped", "???", ""]);

export function isUnmapped(row: InventoryRow): boolean {
  return UNMAPPED_OWNERS.has(row.owner.trim());
}

export function computeMetrics(rows: InventoryRow[] = INVENTORY) {
  const currentTotal = rows.reduce((s, r) => s + r.monthlyCost, 0);
  const priorTotal = rows.reduce((s, r) => s + r.priorCost, 0);
  const surgeAbs = currentTotal - priorTotal;
  const surgePct = priorTotal > 0 ? surgeAbs / priorTotal : null;

  const byRisk = countBy<Risk>(rows, (r) => r.risk);
  const byDecision = countBy<Decision>(rows, (r) => r.decision);
  const byStatus = countBy<Status>(rows, (r) => r.status);

  const spendBySurface = sumBy<Surface>(
    rows,
    (r) => r.surface,
    (r) => r.monthlyCost,
  );

  const unmappedCount = rows.filter(isUnmapped).length;
  const lowConfidenceCount = rows.filter((r) => r.confidence === "L").length;
  // "Needs action" = anything not yet a settled keep/monitor.
  const needsActionCount = rows.filter(
    (r) => r.decision === "fix" || r.decision === "investigate",
  ).length;
  const highRiskCount = byRisk.high ?? 0;
  const openCount = byStatus.open ?? 0;

  // Share of the surge concentrated in the top 3 movers — the "good news"
  // framing from the first update (a small number of fixes).
  const movers = [...rows]
    .map((r) => ({ row: r, delta: deltaOf(r) }))
    .filter((m) => m.delta.abs > 0)
    .sort((a, b) => b.delta.abs - a.delta.abs);
  const top3MoverShare =
    surgeAbs > 0
      ? movers.slice(0, 3).reduce((s, m) => s + m.delta.abs, 0) / surgeAbs
      : null;

  return {
    count: rows.length,
    currentTotal,
    priorTotal,
    surgeAbs,
    surgePct,
    byRisk,
    byDecision,
    byStatus,
    spendBySurface,
    unmappedCount,
    lowConfidenceCount,
    needsActionCount,
    highRiskCount,
    openCount,
    top3MoverShare,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;

/** Rows ranked by absolute delta — the surge first. */
export function topMovers(rows: InventoryRow[] = INVENTORY, limit?: number) {
  const ranked = [...rows]
    .map((row) => ({ row, delta: deltaOf(row) }))
    .sort((a, b) => b.delta.abs - a.delta.abs);
  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

// ---- display label maps -------------------------------------------------

export const SURFACE_LABEL: Record<Surface, string> = {
  OpenAI: "OpenAI",
  Gemini: "Gemini",
  "Cloud billing": "Cloud billing",
  "Run logs": "Run logs",
};

export const DECISION_LABEL: Record<Decision, string> = {
  keep: "Keep",
  fix: "Fix",
  pause: "Pause",
  investigate: "Investigate",
};

export const RISK_LABEL: Record<Risk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  contained: "Contained",
  monitoring: "Monitoring",
};

export const RISK_ORDER: Record<Risk, number> = { high: 0, medium: 1, low: 2 };
