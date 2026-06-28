// Pure derivations over the inventory: formatters, per-row delta, and the
// aggregate metrics the dashboard renders. Kept framework-free so the same
// functions back both the KPI cards and the exports.

import {
  DATA_META,
  INVENTORY,
  type Cadence,
  type Criticality,
  type Decision,
  type Environment,
  type Health,
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

/** Unsigned rate, e.g. a success rate of 0.985 → "98.5%". */
export function formatRate(fraction: number | null, digits = 1): string {
  if (fraction === null) return "—";
  return `${(fraction * 100).toFixed(digits)}%`;
}

/** Compact volume, e.g. 1_200_000 → "1.2M". */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Latency in human units, e.g. 5200 → "5.2s", 900 → "900ms". */
export function formatLatency(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

/** Small-money formatter for unit economics (cents matter here). */
export function formatUnitCost(value: number | null, digits = 2): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(value);
}

// ---- operational health (the reliability lens) --------------------------

/** Thresholds for deriving automation health from raw signals. */
export const HEALTH_THRESHOLDS = {
  /** Below this success rate an automation is failing — paying for failed work. */
  failingSuccess: 0.9,
  /** Below this (but above failing) it's degraded. */
  degradedSuccess: 0.98,
  /** A p95 latency (ms) above this degrades an otherwise-healthy automation. */
  degradedLatencyMs: 4000,
} as const;

export function errorRate(row: InventoryRow): number {
  return 1 - row.successRate;
}

/**
 * Derive automation health from raw observability signals rather than hard-coding
 * it — the reliability lens the cost columns can't show. A high-cost row that is
 * *failing* is paying for work that never lands.
 */
export function opsHealth(row: InventoryRow): Health {
  if (row.successRate < HEALTH_THRESHOLDS.failingSuccess) return "failing";
  if (
    row.successRate < HEALTH_THRESHOLDS.degradedSuccess ||
    row.latencyMsP95 > HEALTH_THRESHOLDS.degradedLatencyMs
  ) {
    return "degraded";
  }
  return "healthy";
}

// ---- unit economics -----------------------------------------------------

/** Cost per call (USD). null when there are no calls to divide by. */
export function costPerCall(row: InventoryRow): number | null {
  return row.calls > 0 ? row.monthlyCost / row.calls : null;
}

/** Cost per 1,000 calls (USD) — a friendlier scale for the table. */
export function costPer1kCalls(row: InventoryRow): number | null {
  const c = costPerCall(row);
  return c === null ? null : c * 1000;
}

/** Cost per million tokens (USD). null for non-token surfaces. */
export function costPerMTok(row: InventoryRow): number | null {
  return row.tokensM && row.tokensM > 0 ? row.monthlyCost / row.tokensM : null;
}

/** Spend lost to failed work this period (error rate × cost). */
export function wastedSpendOf(row: InventoryRow): number {
  return errorRate(row) * row.monthlyCost;
}

export type EfficiencyFlag = "failing" | "over-tiered" | "slow" | null;

const HIGH_TIERS = ["high", "pro"];

/**
 * One human-readable "why is this inefficient" tag, derived from cost and
 * reliability together — drives the fix-first shortlist.
 */
export function efficiencyFlag(row: InventoryRow): EfficiencyFlag {
  if (opsHealth(row) === "failing") return "failing";
  const perK = costPer1kCalls(row);
  const tier = row.modelTier.toLowerCase();
  const highTier = HIGH_TIERS.some((t) => tier.includes(t));
  if (highTier && perK !== null && perK > 25) return "over-tiered";
  if (row.latencyMsP95 > HEALTH_THRESHOLDS.degradedLatencyMs) return "slow";
  return null;
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

  const spendByDecision = sumBy<Decision>(
    rows,
    (r) => r.decision,
    (r) => r.monthlyCost,
  );
  const spendByRisk = sumBy<Risk>(
    rows,
    (r) => r.risk,
    (r) => r.monthlyCost,
  );
  const spendByEnv = sumBy<Environment>(
    rows,
    (r) => r.env,
    (r) => r.monthlyCost,
  );
  const spendByHealth = sumBy<Health>(
    rows,
    (r) => opsHealth(r),
    (r) => r.monthlyCost,
  );
  const spendByCriticality = sumBy<Criticality>(
    rows,
    (r) => r.criticality,
    (r) => r.monthlyCost,
  );

  // Spend-weighted attribution — the thesis as a number, not just a row count.
  const unmappedSpend = rows
    .filter(isUnmapped)
    .reduce((s, r) => s + r.monthlyCost, 0);
  const attributedSpend = currentTotal - unmappedSpend;
  const attributedPct = currentTotal > 0 ? attributedSpend / currentTotal : null;
  const addressableSpend = rows
    .filter((r) => r.decision === "fix" || r.decision === "investigate")
    .reduce((s, r) => s + r.monthlyCost, 0);
  const highRiskSpend = spendByRisk.high ?? 0;
  // Exec framing: what this pace costs over a year.
  const annualizedRunRate = currentTotal * 12;
  const surgeAnnualized = surgeAbs * 12;

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

  // ---- reliability / automation health ----
  const byHealth = countBy<Health>(rows, (r) => opsHealth(r));
  const failingCount = byHealth.failing ?? 0;
  const degradedCount = byHealth.degraded ?? 0;
  const healthyCount = byHealth.healthy ?? 0;
  const atRiskSpend = rows
    .filter((r) => opsHealth(r) !== "healthy")
    .reduce((s, r) => s + r.monthlyCost, 0);
  const failingSpend = rows
    .filter((r) => opsHealth(r) === "failing")
    .reduce((s, r) => s + r.monthlyCost, 0);
  // Revenue-critical workflows that are not healthy — the line a CTO reads first.
  const revenueAtRiskSpend = rows
    .filter((r) => r.criticality === "revenue" && opsHealth(r) !== "healthy")
    .reduce((s, r) => s + r.monthlyCost, 0);

  // ---- usage + unit economics ----
  const totalCalls = rows.reduce((s, r) => s + r.calls, 0);
  const totalTokensM = rows.reduce((s, r) => s + (r.tokensM ?? 0), 0);
  // Call-weighted blended success rate — the one-number reliability headline.
  const blendedSuccess =
    totalCalls > 0
      ? rows.reduce((s, r) => s + r.successRate * r.calls, 0) / totalCalls
      : null;
  // Spend lost to failed work = error_rate × cost, summed across the estate.
  const wastedSpend = rows.reduce((s, r) => s + wastedSpendOf(r), 0);
  const blendedCostPer1kCalls =
    totalCalls > 0 ? (currentTotal / totalCalls) * 1000 : null;

  // ---- 6-month trend (sum of per-row history across the estate) ----
  const monthly = DATA_META.months.map((label, i) => ({
    month: label,
    total: rows.reduce((s, r) => s + (r.history[i] ?? 0), 0),
  }));

  return {
    count: rows.length,
    currentTotal,
    priorTotal,
    surgeAbs,
    surgePct,
    byRisk,
    byDecision,
    byStatus,
    byHealth,
    spendBySurface,
    spendByDecision,
    spendByRisk,
    spendByEnv,
    spendByHealth,
    spendByCriticality,
    unmappedSpend,
    attributedSpend,
    attributedPct,
    addressableSpend,
    highRiskSpend,
    annualizedRunRate,
    surgeAnnualized,
    unmappedCount,
    lowConfidenceCount,
    needsActionCount,
    highRiskCount,
    openCount,
    top3MoverShare,
    failingCount,
    degradedCount,
    healthyCount,
    atRiskSpend,
    failingSpend,
    revenueAtRiskSpend,
    totalCalls,
    totalTokensM,
    blendedSuccess,
    wastedSpend,
    blendedCostPer1kCalls,
    monthly,
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

/**
 * Not-healthy automations ranked by spend — the reliability shortlist. Failing
 * before degraded, then by cost, so the most expensive failures sort to the top.
 */
export function reliabilityConcerns(
  rows: InventoryRow[] = INVENTORY,
  limit?: number,
) {
  const ranked = rows
    .map((row) => ({ row, health: opsHealth(row) }))
    .filter((r) => r.health !== "healthy")
    .sort((a, b) => {
      const order = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];
      return order !== 0 ? order : b.row.monthlyCost - a.row.monthlyCost;
    });
  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

// ---- group rollups (departments, regions, any key) ---------------------

export interface GroupRollup<K extends string> {
  key: K;
  count: number;
  spend: number;
  prior: number;
  surge: number;
  surgePct: number | null;
  unmappedSpend: number;
  failing: number;
  degraded: number;
  atRisk: number;
  calls: number;
  blendedSuccess: number | null;
  /** Share of total spend across the rows passed in (0–1). */
  share: number;
}

/**
 * Roll the inventory up by any key (department, region, surface…) into the
 * cost + reliability summary each org page needs, sorted by spend desc.
 */
export function rollupBy<K extends string>(
  rows: InventoryRow[],
  keyOf: (row: InventoryRow) => K,
): GroupRollup<K>[] {
  const total = rows.reduce((s, r) => s + r.monthlyCost, 0);
  const groups = new Map<K, InventoryRow[]>();
  for (const row of rows) {
    const k = keyOf(row);
    const bucket = groups.get(k);
    if (bucket) bucket.push(row);
    else groups.set(k, [row]);
  }

  const out: GroupRollup<K>[] = [];
  for (const [key, rs] of groups) {
    const spend = rs.reduce((s, r) => s + r.monthlyCost, 0);
    const prior = rs.reduce((s, r) => s + r.priorCost, 0);
    const surge = spend - prior;
    const calls = rs.reduce((s, r) => s + r.calls, 0);
    out.push({
      key,
      count: rs.length,
      spend,
      prior,
      surge,
      surgePct: prior > 0 ? surge / prior : null,
      unmappedSpend: rs.filter(isUnmapped).reduce((s, r) => s + r.monthlyCost, 0),
      failing: rs.filter((r) => opsHealth(r) === "failing").length,
      degraded: rs.filter((r) => opsHealth(r) === "degraded").length,
      atRisk: rs
        .filter((r) => opsHealth(r) !== "healthy")
        .reduce((s, r) => s + r.monthlyCost, 0),
      calls,
      blendedSuccess:
        calls > 0
          ? rs.reduce((s, r) => s + r.successRate * r.calls, 0) / calls
          : null,
      share: total > 0 ? spend / total : 0,
    });
  }
  return out.sort((a, b) => b.spend - a.spend);
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

export const HEALTH_LABEL: Record<Health, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  failing: "Failing",
};

export const HEALTH_ORDER: Record<Health, number> = {
  failing: 0,
  degraded: 1,
  healthy: 2,
};

export const ENV_LABEL: Record<Environment, string> = {
  production: "Production",
  internal: "Internal",
  experimental: "Experimental",
};

export const CRITICALITY_LABEL: Record<Criticality, string> = {
  revenue: "Revenue",
  content: "Content",
  internal: "Internal",
  experimental: "Experimental",
  unknown: "Unknown",
};

export const CADENCE_LABEL: Record<Cadence, string> = {
  realtime: "Real-time",
  scheduled: "Scheduled",
  batch: "Batch",
};

/** Fractional share of a total (0–1). */
export function shareOf(value: number, total: number): number {
  return total > 0 ? value / total : 0;
}
