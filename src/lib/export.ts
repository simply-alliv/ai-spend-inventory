// Client-side exports. The inventory is the deliverable, so getting clean data
// back out (for Finance, a sheet, or the weekly review) is a first-class action.

import { DATA_META, INVENTORY, type InventoryRow } from "@/data/inventory";
import {
  costPer1kCalls,
  costPerCall,
  costPerMTok,
  deltaOf,
  errorRate,
  opsHealth,
} from "@/lib/metrics";

const CSV_COLUMNS: { key: string; header: string; value: (row: InventoryRow) => string | number }[] = [
  { key: "id", header: "id", value: (r) => r.id },
  { key: "surface", header: "surface", value: (r) => r.surface },
  { key: "line_item", header: "line_item", value: (r) => r.lineItem },
  { key: "monthly_cost", header: "monthly_cost_usd", value: (r) => r.monthlyCost },
  { key: "prior_cost", header: "prior_cost_usd", value: (r) => r.priorCost },
  { key: "delta_abs", header: "delta_abs_usd", value: (r) => deltaOf(r).abs },
  {
    key: "delta_pct",
    header: "delta_pct",
    value: (r) => {
      const pct = deltaOf(r).pct;
      return pct === null ? "" : Math.round(pct * 100);
    },
  },
  { key: "workflow", header: "workflow", value: (r) => r.workflow },
  { key: "owner", header: "owner", value: (r) => r.owner },
  { key: "confidence", header: "confidence", value: (r) => r.confidence },
  { key: "model_tier", header: "model_tier", value: (r) => r.modelTier },
  { key: "root_cause", header: "root_cause", value: (r) => r.rootCause },
  { key: "risk", header: "risk", value: (r) => r.risk },
  { key: "decision", header: "decision", value: (r) => r.decision },
  { key: "lever", header: "lever", value: (r) => r.lever },
  { key: "status", header: "status", value: (r) => r.status },
  { key: "calls", header: "calls", value: (r) => r.calls },
  {
    key: "tokens_m",
    header: "tokens_m",
    value: (r) => (r.tokensM === null ? "" : r.tokensM),
  },
  { key: "success_rate", header: "success_rate", value: (r) => r.successRate },
  {
    key: "error_rate",
    header: "error_rate",
    value: (r) => Number(errorRate(r).toFixed(4)),
  },
  { key: "latency_ms_p95", header: "latency_ms_p95", value: (r) => r.latencyMsP95 },
  { key: "health", header: "health", value: (r) => opsHealth(r) },
  {
    key: "cost_per_call",
    header: "cost_per_call_usd",
    value: (r) => {
      const c = costPerCall(r);
      return c === null ? "" : Number(c.toFixed(4));
    },
  },
  {
    key: "cost_per_1k_calls",
    header: "cost_per_1k_calls_usd",
    value: (r) => {
      const c = costPer1kCalls(r);
      return c === null ? "" : Number(c.toFixed(2));
    },
  },
  { key: "env", header: "env", value: (r) => r.env },
  { key: "criticality", header: "criticality", value: (r) => r.criticality },
  { key: "cadence", header: "cadence", value: (r) => r.cadence },
];

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCSV(rows: InventoryRow[] = INVENTORY): string {
  const header = CSV_COLUMNS.map((c) => c.header).join(",");
  const body = rows
    .map((row) => CSV_COLUMNS.map((c) => escapeCsv(c.value(row))).join(","))
    .join("\n");
  return `${header}\n${body}\n`;
}

export function toJSON(rows: InventoryRow[] = INVENTORY): string {
  return JSON.stringify(
    {
      meta: DATA_META,
      rows: rows.map((row) => ({
        ...row,
        delta: deltaOf(row),
        health: opsHealth(row),
        errorRate: errorRate(row),
        costPerCall: costPerCall(row),
        costPer1kCalls: costPer1kCalls(row),
        costPerMTok: costPerMTok(row),
      })),
    },
    null,
    2,
  );
}

function timestampedName(ext: string): string {
  const tag = DATA_META.illustrative ? "illustrative" : "data";
  return `ai-spend-inventory_${tag}_${DATA_META.period.replace(/\s+/g, "-")}.${ext}`;
}

function triggerDownload(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(rows: InventoryRow[] = INVENTORY): void {
  triggerDownload(timestampedName("csv"), toCSV(rows), "text/csv;charset=utf-8");
}

export function downloadJSON(rows: InventoryRow[] = INVENTORY): void {
  triggerDownload(timestampedName("json"), toJSON(rows), "application/json");
}
