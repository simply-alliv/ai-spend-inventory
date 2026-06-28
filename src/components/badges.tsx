// Semantic badges + the delta indicator. These translate the inventory's
// triage language (risk / decision / status / confidence) into consistent,
// colour-coded chips so the table reads at a glance.

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  Confidence,
  Decision,
  Health,
  InventoryRow,
  Risk,
  Status,
} from "@/data/inventory";
import {
  deltaMagnitude,
  deltaOf,
  DECISION_LABEL,
  formatPercent,
  formatSignedCurrency,
  HEALTH_LABEL,
  RISK_LABEL,
  STATUS_LABEL,
} from "@/lib/metrics";

type Tone = "emerald" | "amber" | "rose" | "violet" | "sky" | "slate";

const TONE_CLASS: Record<Tone, string> = {
  emerald:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amber:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  rose: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  violet:
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-400",
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  slate:
    "border-slate-400/25 bg-slate-400/10 text-slate-600 dark:text-slate-300",
};

const DOT_CLASS: Record<Tone, string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  slate: "bg-slate-400",
};

function TonedBadge({
  tone,
  dot = true,
  children,
}: {
  tone: Tone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", TONE_CLASS[tone])}>
      {dot && <span className={cn("size-1.5 rounded-full", DOT_CLASS[tone])} />}
      {children}
    </Badge>
  );
}

const RISK_TONE: Record<Risk, Tone> = {
  high: "rose",
  medium: "amber",
  low: "emerald",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return <TonedBadge tone={RISK_TONE[risk]}>{RISK_LABEL[risk]}</TonedBadge>;
}

const DECISION_TONE: Record<Decision, Tone> = {
  keep: "emerald",
  fix: "amber",
  investigate: "violet",
  pause: "rose",
};

export function DecisionBadge({ decision }: { decision: Decision }) {
  return (
    <TonedBadge tone={DECISION_TONE[decision]}>
      {DECISION_LABEL[decision]}
    </TonedBadge>
  );
}

const STATUS_TONE: Record<Status, Tone> = {
  open: "amber",
  contained: "emerald",
  monitoring: "sky",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <TonedBadge tone={STATUS_TONE[status]} dot={false}>
      {STATUS_LABEL[status]}
    </TonedBadge>
  );
}

const HEALTH_TONE: Record<Health, Tone> = {
  healthy: "emerald",
  degraded: "amber",
  failing: "rose",
};

export function HealthBadge({ health }: { health: Health }) {
  return <TonedBadge tone={HEALTH_TONE[health]}>{HEALTH_LABEL[health]}</TonedBadge>;
}

const CONFIDENCE_TONE: Record<Confidence, Tone> = {
  H: "emerald",
  M: "amber",
  L: "rose",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  H: "High",
  M: "Med",
  L: "Low",
};

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  return (
    <TonedBadge tone={CONFIDENCE_TONE[confidence]} dot={false}>
      {CONFIDENCE_LABEL[confidence]}
    </TonedBadge>
  );
}

/** Rising cost is bad (rose), falling is good (emerald), flat is muted. */
export function DeltaIndicator({
  row,
  showAbs = true,
}: {
  row: InventoryRow;
  showAbs?: boolean;
}) {
  const { abs, pct, direction } = deltaOf(row);
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : ArrowRight;
  const tone =
    direction === "up"
      ? "text-rose-600 dark:text-rose-400"
      : direction === "down"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  return (
    <span
      className={cn("inline-flex items-center gap-1 tabular-nums", tone)}
      title={`${deltaMagnitude(row)}  ${formatSignedCurrency(abs)} vs prior`}
    >
      <Icon className="size-3.5" aria-hidden />
      <span className="font-medium">{formatPercent(pct)}</span>
      {showAbs && (
        <span className="text-muted-foreground">
          ({formatSignedCurrency(abs)})
        </span>
      )}
    </span>
  );
}
