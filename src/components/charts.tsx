// Three charts that tell the surge story: where the money sits (by surface),
// which line items moved (top movers by Δ), and how this period compares to the
// prior one per surface. All built on the shadcn chart wrapper over Recharts.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
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
import {
  INVENTORY,
  type Risk,
  type Surface,
} from "@/data/inventory";
import {
  computeMetrics,
  formatCurrency,
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

const CURRENT_COLOR = "#6366f1";
const PRIOR_COLOR = "#94a3b8";

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

// ---- Spend by surface (donut) ------------------------------------------

function SpendBySurfaceChart() {
  const m = computeMetrics();
  const data = (Object.entries(m.spendBySurface) as [Surface, number][])
    .map(([surface, value]) => ({ surface, value, fill: SURFACE_COLOR[surface] }))
    .sort((a, b) => b.value - a.value);

  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.surface, { label: d.surface, color: d.fill }]),
  );

  return (
    <ChartCard title="Spend by surface" description="Where this period's spend sits">
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[220px]">
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
            nameKey="surface"
            innerRadius={55}
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.surface} fill={d.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {data.map((d) => (
          <div key={d.surface} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-[2px]"
                style={{ backgroundColor: d.fill }}
              />
              {d.surface}
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

function TopMoversChart() {
  const data = topMovers(INVENTORY, 6).map(({ row, delta }) => ({
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

function SurfaceTrendChart() {
  const surfaces: Surface[] = ["OpenAI", "Gemini", "Cloud billing", "Run logs"];
  const data = surfaces.map((surface) => {
    const rows = INVENTORY.filter((r) => r.surface === surface);
    return {
      surface,
      current: rows.reduce((s, r) => s + r.monthlyCost, 0),
      prior: rows.reduce((s, r) => s + r.priorCost, 0),
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

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <SpendBySurfaceChart />
      <TopMoversChart />
      <SurfaceTrendChart />
    </div>
  );
}
