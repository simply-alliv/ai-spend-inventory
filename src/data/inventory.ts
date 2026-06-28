// AI Spend Inventory — data model + illustrative dataset.
//
// IMPORTANT: Every number, project name, key name, and team name below is a
// CLEARLY-LABELLED ILLUSTRATIVE PLACEHOLDER. There is no real Storm Ideas
// invoice, key, or log data here. The *shape* and the *method* are what's real
// and ready to run against actual data on day one. See DATA_META.illustrative.
//
// Source artifact this mirrors:
//   take-home-exercise-interview/solution/templates/ai-spend-inventory.md

export type Surface = "OpenAI" | "Gemini" | "Cloud billing" | "Run logs";

/** Owner-attribution confidence on the owner guess. */
export type Confidence = "H" | "M" | "L";

/** 🟢 low / 🟠 medium / 🔴 high cost &/or reliability risk. */
export type Risk = "low" | "medium" | "high";

/** The point of the whole exercise — what we decided to do with the line item. */
export type Decision = "keep" | "fix" | "pause" | "investigate";

/** Track to completion. */
export type Status = "open" | "contained" | "monitoring";

export interface InventoryRow {
  /** Stable row id — reference it in updates and decisions. */
  id: string;
  /** Where the spend appears. The signal is fragmented; name the source. */
  surface: Surface;
  /** The raw name as it appears on that surface — preserved for traceability. */
  lineItem: string;
  /** Current period cost (USD). */
  monthlyCost: number;
  /** Prior period cost (USD). The surge lives in the delta between the two. */
  priorCost: number;
  /** The workflow it maps to — connects cost to what it does. */
  workflow: string;
  /** Named owner / team. "Unmapped" when not recorded anywhere yet. */
  owner: string;
  /** H / M / L on the owner guess — don't act on low-confidence attributions. */
  confidence: Confidence;
  /** Model + tier in use — often the root cause and the cheapest lever. */
  modelTier: string;
  /** Why it moved (if a mover) — turns a number into an action. */
  rootCause: string;
  /** Triage priority. */
  risk: Risk;
  /** keep / fix / pause / investigate. */
  decision: Decision;
  /** The specific reversible action. Reversible-first; kill switch last. */
  lever: string;
  /** open / contained / monitoring. */
  status: Status;
}

export const DATA_META = {
  /** Hard flag: this dataset is illustrative, not real Storm data. */
  illustrative: true,
  /** The period the "current" column represents (illustrative). */
  period: "May 2025",
  priorPeriod: "Apr 2025",
  currency: "USD",
  /** Last time the illustrative dataset was shaped. */
  asOf: "2025-05-31",
} as const;

/**
 * Illustrative inventory — ~one row per billing line item, joined across every
 * surface. Numbers are placeholders chosen only to demonstrate how the table
 * drives triage (rank by delta, attribute owner, pick a reversible lever).
 */
export const INVENTORY: InventoryRow[] = [
  {
    id: "L-01",
    surface: "OpenAI",
    lineItem: "proj-codex-batch",
    monthlyCost: 14200,
    priorCost: 3200,
    workflow: "Nightly reporting script",
    owner: "Unmapped",
    confidence: "L",
    modelTier: "gpt-tier-high",
    rootCause: "Nightly job looping on retries; no max-tokens cap",
    risk: "high",
    decision: "fix",
    lever: "Add max-tokens + stop retry storm; budget cap",
    status: "open",
  },
  {
    id: "L-02",
    surface: "Gemini",
    lineItem: "aistudio-key-7",
    monthlyCost: 9800,
    priorCost: 4100,
    workflow: "Content automation",
    owner: "Content",
    confidence: "M",
    modelTier: "pro-tier",
    rootCause: "Fan-out per asset on high tier where flash would do",
    risk: "medium",
    decision: "fix",
    lever: "Downgrade tier + batch + cap",
    status: "open",
  },
  {
    id: "L-03",
    surface: "Cloud billing",
    lineItem: "gcp-proj-support",
    monthlyCost: 3400,
    priorCost: 2950,
    workflow: "Internal support prompts",
    owner: "Support",
    confidence: "M",
    modelTier: "—",
    rootCause: "New prompt added; modest steady growth",
    risk: "low",
    decision: "keep",
    lever: "Budget cap + alert",
    status: "monitoring",
  },
  {
    id: "L-04",
    surface: "Run logs",
    lineItem: "unknown-key-3",
    monthlyCost: 7600,
    priorCost: 2500,
    workflow: "Unmapped",
    owner: "Unmapped",
    confidence: "L",
    modelTier: "unknown",
    rootCause: "Owner not recorded anywhere yet",
    risk: "high",
    decision: "investigate",
    lever: "Time-box owner hunt → escalate to sponsor",
    status: "open",
  },
  {
    id: "L-05",
    surface: "OpenAI",
    lineItem: "proj-exp-sandbox",
    monthlyCost: 2100,
    priorCost: 2050,
    workflow: "Experiments",
    owner: "R&D",
    confidence: "H",
    modelTier: "mixed",
    rootCause: "Stable; within expectation",
    risk: "low",
    decision: "keep",
    lever: "Cap + alert",
    status: "monitoring",
  },
  {
    id: "L-06",
    surface: "Gemini",
    lineItem: "aistudio-key-2",
    monthlyCost: 1650,
    priorCost: 1500,
    workflow: "Content QA summaries",
    owner: "Content",
    confidence: "H",
    modelTier: "flash-tier",
    rootCause: "Within plan",
    risk: "low",
    decision: "keep",
    lever: "Cap + alert",
    status: "monitoring",
  },
  {
    id: "L-07",
    surface: "Cloud billing",
    lineItem: "gcp-proj-media",
    monthlyCost: 4300,
    priorCost: 1800,
    workflow: "Media transcode + captioning",
    owner: "Product (Media)",
    confidence: "M",
    modelTier: "—",
    rootCause: "New feature ramp; batch window too wide",
    risk: "medium",
    decision: "fix",
    lever: "Right-size batch window + cap",
    status: "open",
  },
  {
    id: "L-08",
    surface: "OpenAI",
    lineItem: "proj-support-agent",
    monthlyCost: 2500,
    priorCost: 2200,
    workflow: "Internal support agent",
    owner: "Support",
    confidence: "H",
    modelTier: "gpt-tier-mid",
    rootCause: "Steady usage",
    risk: "low",
    decision: "keep",
    lever: "Cap + alert",
    status: "monitoring",
  },
  {
    id: "L-09",
    surface: "Run logs",
    lineItem: "svc-embeddings-7",
    monthlyCost: 3900,
    priorCost: 900,
    workflow: "Search / embeddings reindex",
    owner: "Platform",
    confidence: "M",
    modelTier: "embed-tier",
    rootCause: "Full reindex looping instead of incremental",
    risk: "medium",
    decision: "fix",
    lever: "Throttle reindex + go incremental; cap",
    status: "open",
  },
  {
    id: "L-10",
    surface: "Gemini",
    lineItem: "aistudio-key-9",
    monthlyCost: 2400,
    priorCost: 600,
    workflow: "Marketing copy drafts",
    owner: "Marketing",
    confidence: "L",
    modelTier: "pro-tier",
    rootCause: "Un-owned spike; owner unconfirmed",
    risk: "medium",
    decision: "investigate",
    lever: "Confirm owner → tier review",
    status: "open",
  },
  {
    id: "L-11",
    surface: "Cloud billing",
    lineItem: "gcp-proj-analytics",
    monthlyCost: 1500,
    priorCost: 1400,
    workflow: "Reporting dashboards",
    owner: "Data / BI",
    confidence: "H",
    modelTier: "—",
    rootCause: "Stable",
    risk: "low",
    decision: "keep",
    lever: "Cap + alert",
    status: "monitoring",
  },
];
