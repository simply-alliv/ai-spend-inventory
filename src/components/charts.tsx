// Three charts that tell the surge story: a multi-dimension spend breakdown
// (by surface / decision / risk), which line items moved (top movers by Δ), and
// how this period compares to the prior one per surface. Built on the shadcn
// chart wrapper over Recharts.

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import {
  INVENTORY,
  type Criticality,
  type Decision,
  type Health,
  type InventoryRow,
  type Risk,
  type Surface,
} from "@/data/inventory";
import {
  computeMetrics,
  costPerCall,
  CRITICALITY_LABEL,
  DECISION_LABEL,
  formatCompact,
  formatCurrency,
  formatLatency,
  HEALTH_LABEL,
  opsHealth,
  RISK_LABEL,
  topMovers,
} from "@/lib/metrics";

const SURFACE_COLOR: Record<Surface, string> = {
  OpenAI: "#10b981",
  Gemini: "#8b5cf6",
  "Cloud billing": "#0ea5e9",
  "Run logs": "#f59e0b",
};

const RISK_COLOR: Record<Risk, string> = {
  high: "#f43f5e",
  medium: "#f59e0b",
  low: "#10b981",
};

const DECISION_COLOR: Record<Decision, string> = {
  keep: "#10b981",
  fix: "#f59e0b",
  investigate: "#8b5cf6",
  pause: "#f43f5e",
};

const HEALTH_COLOR: Record<Health, string> = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  failing: "#f43f5e",
};

const CRITICALITY_COLOR: Record<Criticality, string> = {
  revenue: "#f43f5e",
  content: "#8b5cf6",
  internal: "#0ea5e9",
  experimental: "#94a3b8",
  unknown: "#f59e0b",
};

const CURRENT_COLOR = "#6366f1";
const PRIOR_COLOR = "#94a3b8";

function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---- Spend breakdown (donut, switchable dimension) ---------------------

type Dimension = "surface" | "health" | "criticality" | "decision" | "risk";

interface Slice {
  key: string;
  label: string;
  value: number;
  fill: string;
}

function breakdownData(dimension: Dimension, rows: InventoryRow[]): Slice[] {
  const m = computeMetrics(rows);
  let slices: Slice[];

  if (dimension === "decision") {
    slices = (Object.entries(m.spendByDecision) as [Decision, number][]).map(
      ([key, value]) => ({
        key,
        label: DECISION_LABEL[key],
        value,
        fill: DECISION_COLOR[key],
      }),
    );
  } else if (dimension === "risk") {
    slices = (Object.entries(m.spendByRisk) as [Risk, number][]).map(
      ([key, value]) => ({
        key,
        label: `${RISK_LABEL[key]} risk`,
        value,
        fill: RISK_COLOR[key],
      }),
    );
  } else if (dimension === "health") {
    slices = (Object.entries(m.spendByHealth) as [Health, number][]).map(
      ([key, value]) => ({
        key,
        label: HEALTH_LABEL[key],
        value,
        fill: HEALTH_COLOR[key],
      }),
    );
  } else if (dimension === "criticality") {
    slices = (Object.entries(m.spendByCriticality) as [Criticality, number][]).map(
      ([key, value]) => ({
        key,
        label: CRITICALITY_LABEL[key],
        value,
        fill: CRITICALITY_COLOR[key],
      }),
    );
  } else {
    slices = (Object.entries(m.spendBySurface) as [Surface, number][]).map(
      ([key, value]) => ({ key, label: key, value, fill: SURFACE_COLOR[key] }),
    );
  }

  return slices.sort((a, b) => b.value - a.value);
}

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "surface", label: "Surface" },
  { key: "health", label: "Health" },
  { key: "criticality", label: "Criticality" },
  { key: "decision", label: "Decision" },
];

export function SpendBreakdownChart({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const [dimension, setDimension] = useState<Dimension>("surface");
  const data = breakdownData(dimension, rows);
  const total = data.reduce((s, d) => s + d.value, 0);

  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.label, { label: d.label, color: d.fill }]),
  );

  const toggle = (
    <div className="inline-flex shrink-0 rounded-lg border bg-muted/40 p-0.5 text-xs">
      {DIMENSIONS.map((d) => (
        <button
          key={d.key}
          type="button"
          onClick={() => setDimension(d.key)}
          aria-pressed={dimension === d.key}
          className={cn(
            "rounded-md px-2 py-1 font-medium transition-colors",
            dimension === d.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {d.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Spend breakdown"
      description="Where this period's spend sits"
      action={toggle}
    >
      <div className="relative">
        <ChartContainer
          config={config}
          className="mx-auto aspect-square max-h-[220px]"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name}</span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              strokeWidth={2}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Total / mo</span>
          <span className="text-xl font-semibold tabular-nums tracking-tight">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-[2px]"
                style={{ backgroundColor: d.fill }}
              />
              {d.label}
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(d.value)}
            </span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ---- Top movers by delta (horizontal bars) -----------------------------

export function TopMoversChart({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const data = topMovers(rows, 6).map(({ row, delta }) => ({
    label: `${row.id}  ${row.lineItem}`,
    delta: delta.abs,
    risk: row.risk,
    fill: RISK_COLOR[row.risk],
  }));

  const config: ChartConfig = {
    delta: { label: "Δ vs prior" },
    high: { label: RISK_LABEL.high, color: RISK_COLOR.high },
    medium: { label: RISK_LABEL.medium, color: RISK_COLOR.medium },
    low: { label: RISK_LABEL.low, color: RISK_COLOR.low },
  };

  return (
    <ChartCard
      title="Top movers (Δ vs prior)"
      description="The surge is concentrated — rank by movement, not size"
    >
      <ChartContainer config={config} className="h-[260px] w-full">
        <BarChart
          accessibilityLayer
          data={data}
          layout="vertical"
          margin={{ left: 8, right: 36 }}
        >
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => formatCurrency(Number(value))}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => (
                  <span className="font-medium tabular-nums">
                    {formatCurrency(Number(value))}
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="delta" radius={4}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.fill} />
            ))}
            <LabelList
              dataKey="delta"
              position="right"
              className="fill-muted-foreground"
              fontSize={11}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

// ---- Current vs prior by surface (grouped bars) ------------------------

export function SurfaceTrendChart({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const surfaces: Surface[] = ["OpenAI", "Gemini", "Cloud billing", "Run logs"];
  const data = surfaces.map((surface) => {
    const surfaceRows = rows.filter((r) => r.surface === surface);
    return {
      surface,
      current: surfaceRows.reduce((s, r) => s + r.monthlyCost, 0),
      prior: surfaceRows.reduce((s, r) => s + r.priorCost, 0),
    };
  });

  const config: ChartConfig = {
    current: { label: "This period", color: CURRENT_COLOR },
    prior: { label: "Prior period", color: PRIOR_COLOR },
  };

  return (
    <ChartCard
      title="This period vs prior"
      description="Surge by surface — what changed since last month"
    >
      <ChartContainer config={config} className="h-[260px] w-full">
        <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="surface"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            interval={0}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(Number(value))}
            tickLine={false}
            axisLine={false}
            width={52}
            fontSize={11}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[name as string]?.label ?? name}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar dataKey="prior" fill={PRIOR_COLOR} radius={[3, 3, 0, 0]} />
          <Bar dataKey="current" fill={CURRENT_COLOR} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: PRIOR_COLOR }}
          />
          Prior period
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-[2px]"
            style={{ backgroundColor: CURRENT_COLOR }}
          />
          This period
        </span>
      </div>
    </ChartCard>
  );
}

// ---- Spend over time (6-month area) ------------------------------------

export function SpendTrendChart({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const m = computeMetrics(rows);
  const data = m.monthly;

  const config: ChartConfig = {
    total: { label: "Total spend", color: "#6366f1" },
  };

  return (
    <ChartCard
      title="Spend over time"
      description="Trailing 6 months — a flat base, then a single-month step change"
    >
      <ChartContainer config={config} className="h-[240px] w-full">
        <AreaChart data={data} margin={{ left: 4, right: 8 }}>
          <defs>
            <linearGradient id="spendTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            tickFormatter={(value) => formatCurrency(Number(value))}
            tickLine={false}
            axisLine={false}
            width={52}
            fontSize={11}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelKey="month"
                formatter={(value) => (
                  <span className="font-medium tabular-nums">
                    {formatCurrency(Number(value))}
                  </span>
                )}
              />
            }
          />
          <Area
            dataKey="total"
            type="monotone"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#spendTrendFill)"
          />
        </AreaChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-muted-foreground">
        The surge is a step, not a trend — which is exactly why per-line attribution
        beats a blanket cut.
      </p>
    </ChartCard>
  );
}

// ---- Cost vs reliability (scatter, the fix-first quadrant) --------------

export function ReliabilityScatter({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  const data = rows.map((row) => {
    const health = opsHealth(row);
    return {
      x: row.monthlyCost,
      y: row.successRate * 100,
      z: row.calls,
      label: `${row.id}  ${row.lineItem}`,
      perCall: costPerCall(row),
      latency: row.latencyMsP95,
      health,
      fill: HEALTH_COLOR[health],
    };
  });

  const config: ChartConfig = {
    healthy: { label: HEALTH_LABEL.healthy, color: HEALTH_COLOR.healthy },
    degraded: { label: HEALTH_LABEL.degraded, color: HEALTH_COLOR.degraded },
    failing: { label: HEALTH_LABEL.failing, color: HEALTH_COLOR.failing },
  };

  return (
    <ChartCard
      title="Cost vs reliability"
      description="Bottom-right = expensive and failing → fix first. Bubble = call volume."
    >
      <ChartContainer config={config} className="h-[240px] w-full">
        <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            name="Monthly cost"
            tickFormatter={(value) => formatCurrency(Number(value))}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Success rate"
            domain={[60, 100]}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
            axisLine={false}
            width={40}
            fontSize={11}
          />
          <ZAxis type="number" dataKey="z" range={[60, 520]} name="Calls" />
          <ReferenceLine y={90} stroke="#f43f5e" strokeDasharray="4 4" />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as (typeof data)[number];
              return (
                <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xs">
                  <div className="font-medium">{p.label}</div>
                  <div className="mt-0.5 text-muted-foreground">
                    {formatCurrency(p.x)}/mo · {p.y.toFixed(1)}% success ·{" "}
                    {formatCompact(p.z)} calls · {formatLatency(p.latency)} p95
                  </div>
                </div>
              );
            }}
          />
          <Scatter data={data}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.fill} fillOpacity={0.8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ChartContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        {(Object.keys(HEALTH_COLOR) as Health[]).map((h) => (
          <span key={h} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: HEALTH_COLOR[h] }}
            />
            {HEALTH_LABEL[h]}
          </span>
        ))}
      </div>
    </ChartCard>
  );
}

export function DashboardCharts({ rows = INVENTORY }: { rows?: InventoryRow[] }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SpendBreakdownChart rows={rows} />
        <TopMoversChart rows={rows} />
        <SurfaceTrendChart rows={rows} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendTrendChart rows={rows} />
        </div>
        <ReliabilityScatter rows={rows} />
      </div>
    </div>
  );
}
