// AI Spend Inventory — data model + illustrative dataset.
//
// IMPORTANT: Every number, project name, key name, team, department, and region
// below is a CLEARLY-LABELLED ILLUSTRATIVE PLACEHOLDER for a fictional tenant
// ("Acme Corp"). There is no real customer invoice, key, or log data here. The
// *shape* and the *method* are what's real and ready to run against actual data
// on day one. See DATA_META.illustrative.

export type Surface = "OpenAI" | "Gemini" | "Cloud billing" | "Run logs";

/** Owning department — the primary allocation / showback dimension. */
export type Department =
  | "Product"
  | "Content"
  | "Support"
  | "Platform"
  | "Marketing"
  | "Data & BI"
  | "R&D"
  | "Unmapped";

/** Region the workflow is attributed to. */
export type Region = "AMER" | "EMEA" | "APAC" | "Global";

export const DEPARTMENTS: Department[] = [
  "Product",
  "Content",
  "Support",
  "Platform",
  "Marketing",
  "Data & BI",
  "R&D",
  "Unmapped",
];

export const REGIONS: Region[] = ["AMER", "EMEA", "APAC", "Global"];

/** Owner-attribution confidence on the owner guess. */
export type Confidence = "H" | "M" | "L";

/** 🟢 low / 🟠 medium / 🔴 high cost &/or reliability risk. */
export type Risk = "low" | "medium" | "high";

/** The point of the whole exercise — what we decided to do with the line item. */
export type Decision = "keep" | "fix" | "pause" | "investigate";

/** Track to completion. */
export type Status = "open" | "contained" | "monitoring";

/** Where the workflow runs — an allocation/tagging dimension (FinOps showback). */
export type Environment = "production" | "internal" | "experimental";

/**
 * Business blast radius if the workflow stops — what a CTO weighs *before* a
 * pause. "unknown" is itself a finding: we can't price the risk of stopping it.
 */
export type Criticality =
  | "revenue"
  | "content"
  | "internal"
  | "experimental"
  | "unknown";

/** How the workflow executes — shapes which reversible lever is cheapest. */
export type Cadence = "realtime" | "scheduled" | "batch";

/** Derived operational health of an automation. @see opsHealth in lib/metrics. */
export type Health = "healthy" | "degraded" | "failing";

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

  // ---- Operational signals (the reliability lens, not just the cost lens) ----

  /** Monthly request / run volume on this line item — drives unit economics. */
  calls: number;
  /**
   * Tokens consumed this period, in millions. `null` for non-token surfaces
   * (e.g. cloud infra, media transcode) where tokens aren't the meter.
   */
  tokensM: number | null;
  /** Share of requests that completed successfully (0–1). Error rate = 1 − this. */
  successRate: number;
  /** p95 end-to-end latency in milliseconds — the user-felt performance signal. */
  latencyMsP95: number;
  /** Where it runs — allocation dimension + "experiment crept into prod" signal. */
  env: Environment;
  /** Business blast radius if it stops — gates how cautious a pause must be. */
  criticality: Criticality;
  /** How it executes — informs the cheapest reversible lever. */
  cadence: Cadence;
  /**
   * Trailing 6-month cost (oldest→newest) for trend analysis. By construction
   * `history[5] === monthlyCost` and `history[4] === priorCost`.
   */
  history: number[];
  /** Owning department — the primary allocation / showback dimension. */
  department: Department;
  /** Region the workflow is attributed to. */
  region: Region;
}

export const DATA_META = {
  /** Hard flag: this dataset is illustrative, not real customer data. */
  illustrative: true,
  /** The period the "current" column represents (illustrative). */
  period: "May 2025",
  priorPeriod: "Apr 2025",
  currency: "USD",
  /** Last time the illustrative dataset was shaped. */
  asOf: "2025-05-31",
  /** Labels for the trailing-6-month `history` series (oldest→newest). */
  months: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
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
    calls: 480000,
    tokensM: 320,
    successRate: 0.71,
    latencyMsP95: 5200,
    env: "internal",
    criticality: "internal",
    cadence: "scheduled",
    history: [2900, 3000, 3200, 3100, 3200, 14200],
    department: "Unmapped",
    region: "AMER",
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
    calls: 210000,
    tokensM: 180,
    successRate: 0.985,
    latencyMsP95: 2200,
    env: "production",
    criticality: "content",
    cadence: "batch",
    history: [3000, 3500, 3900, 4000, 4100, 9800],
    department: "Content",
    region: "EMEA",
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
    calls: 95000,
    tokensM: 40,
    successRate: 0.991,
    latencyMsP95: 1400,
    env: "internal",
    criticality: "internal",
    cadence: "realtime",
    history: [2600, 2750, 2900, 2950, 2950, 3400],
    department: "Support",
    region: "AMER",
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
    calls: 150000,
    tokensM: 95,
    successRate: 0.94,
    latencyMsP95: 3100,
    env: "production",
    criticality: "unknown",
    cadence: "scheduled",
    history: [2200, 2400, 2500, 2450, 2500, 7600],
    department: "Unmapped",
    region: "APAC",
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
    calls: 28000,
    tokensM: 22,
    successRate: 0.9,
    latencyMsP95: 2600,
    env: "experimental",
    criticality: "experimental",
    cadence: "realtime",
    history: [1800, 1900, 2050, 2000, 2050, 2100],
    department: "R&D",
    region: "Global",
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
    calls: 120000,
    tokensM: 30,
    successRate: 0.997,
    latencyMsP95: 900,
    env: "production",
    criticality: "content",
    cadence: "batch",
    history: [1300, 1400, 1480, 1500, 1500, 1650],
    department: "Content",
    region: "AMER",
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
    calls: 36000,
    tokensM: null,
    successRate: 0.96,
    latencyMsP95: 8800,
    env: "production",
    criticality: "revenue",
    cadence: "batch",
    history: [1400, 1600, 1750, 2000, 1800, 4300],
    department: "Product",
    region: "EMEA",
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
    calls: 64000,
    tokensM: 48,
    successRate: 0.982,
    latencyMsP95: 1800,
    env: "internal",
    criticality: "internal",
    cadence: "realtime",
    history: [1900, 2050, 2150, 2200, 2200, 2500],
    department: "Support",
    region: "EMEA",
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
    calls: 1200000,
    tokensM: 240,
    successRate: 0.999,
    latencyMsP95: 300,
    env: "production",
    criticality: "revenue",
    cadence: "batch",
    history: [820, 850, 900, 880, 900, 3900],
    department: "Platform",
    region: "Global",
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
    calls: 40000,
    tokensM: 36,
    successRate: 0.95,
    latencyMsP95: 2400,
    env: "production",
    criticality: "content",
    cadence: "realtime",
    history: [400, 480, 600, 560, 600, 2400],
    department: "Marketing",
    region: "AMER",
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
    calls: 18000,
    tokensM: null,
    successRate: 0.995,
    latencyMsP95: 1200,
    env: "internal",
    criticality: "internal",
    cadence: "scheduled",
    history: [1250, 1300, 1380, 1400, 1400, 1500],
    department: "Data & BI",
    region: "Global",
  },
  {
    id: "L-12",
    surface: "OpenAI",
    lineItem: "proj-chat-widget",
    monthlyCost: 5200,
    priorCost: 4800,
    workflow: "Customer-facing chat widget",
    owner: "Product (Web)",
    confidence: "H",
    modelTier: "gpt-tier-mid",
    rootCause: "p95 latency creeping; no streaming, retries on timeout",
    risk: "medium",
    decision: "fix",
    lever: "Enable streaming + tune timeouts; cap",
    status: "open",
    calls: 380000,
    tokensM: 140,
    successRate: 0.972,
    latencyMsP95: 4300,
    env: "production",
    criticality: "revenue",
    cadence: "realtime",
    history: [4200, 4400, 4700, 4800, 4800, 5200],
    department: "Product",
    region: "AMER",
  },
  {
    id: "L-13",
    surface: "Run logs",
    lineItem: "svc-ocr-batch",
    monthlyCost: 2900,
    priorCost: 2600,
    workflow: "Document OCR pipeline",
    owner: "Platform",
    confidence: "M",
    modelTier: "vision-tier",
    rootCause: "17% of pages error then silently retry — paying for failed work",
    risk: "high",
    decision: "fix",
    lever: "Validate inputs; dead-letter failures; cap retries",
    status: "open",
    calls: 90000,
    tokensM: 70,
    successRate: 0.83,
    latencyMsP95: 6100,
    env: "production",
    criticality: "internal",
    cadence: "batch",
    history: [2100, 2300, 2500, 2600, 2600, 2900],
    department: "Platform",
    region: "APAC",
  },
  {
    id: "L-14",
    surface: "Gemini",
    lineItem: "aistudio-key-12",
    monthlyCost: 1850,
    priorCost: 1700,
    workflow: "Localization / translation",
    owner: "Content",
    confidence: "H",
    modelTier: "flash-tier",
    rootCause: "Within plan; volume up with catalogue",
    risk: "low",
    decision: "keep",
    lever: "Cap + alert",
    status: "monitoring",
    calls: 220000,
    tokensM: 52,
    successRate: 0.994,
    latencyMsP95: 1100,
    env: "production",
    criticality: "content",
    cadence: "batch",
    history: [1400, 1500, 1650, 1700, 1700, 1850],
    department: "Content",
    region: "APAC",
  },
  {
    id: "L-15",
    surface: "Cloud billing",
    lineItem: "gcp-proj-vector",
    monthlyCost: 2200,
    priorCost: 1900,
    workflow: "RAG vector store",
    owner: "Platform",
    confidence: "M",
    modelTier: "—",
    rootCause: "Index growth; steady",
    risk: "low",
    decision: "keep",
    lever: "Cap + alert; review index TTL",
    status: "monitoring",
    calls: 60000,
    tokensM: null,
    successRate: 0.998,
    latencyMsP95: 250,
    env: "production",
    criticality: "revenue",
    cadence: "realtime",
    history: [1600, 1700, 1850, 1900, 1900, 2200],
    department: "Platform",
    region: "Global",
  },
  {
    id: "L-16",
    surface: "OpenAI",
    lineItem: "proj-sales-enrich",
    monthlyCost: 1700,
    priorCost: 500,
    workflow: "Sales lead enrichment",
    owner: "Unmapped",
    confidence: "L",
    modelTier: "gpt-tier-high",
    rootCause: "Pilot promoted to prod without owner; high tier",
    risk: "medium",
    decision: "investigate",
    lever: "Confirm owner → downgrade tier; cap",
    status: "open",
    calls: 52000,
    tokensM: 28,
    successRate: 0.93,
    latencyMsP95: 2000,
    env: "production",
    criticality: "revenue",
    cadence: "scheduled",
    history: [0, 300, 500, 480, 500, 1700],
    department: "Unmapped",
    region: "AMER",
  },
];
