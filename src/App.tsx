import { ExternalLink, Info } from "lucide-react";

import { DashboardCharts } from "@/components/charts";
import { InventoryTable } from "@/components/inventory-table";
import { KpiCards } from "@/components/kpi-cards";
import { SiteHeader } from "@/components/site-header";
import { DATA_META } from "@/data/inventory";

const REPO_URL = "https://github.com/simply-alliv/ai-spend-inventory";

const LOOP_STEPS = [
  "Populate every row from the real surfaces",
  "Sort by Δ vs prior — surface the movers",
  "Attribute owner → diagnose root cause",
  "Pick the most reversible lever",
  "Cap + alert every row, not just movers",
];

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <section className="space-y-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {DATA_META.period} vs {DATA_META.priorPeriod} · {DATA_META.currency}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              We don't have a spend problem. We have an attribution problem that
              shows up as spend.
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              One row per billing line item, joined across cloud billing, provider
              dashboards, and run logs — so spend can finally be tied to a workflow
              and an owner. Rank by movement, attribute the few big movers, and reach
              for the most reversible lever first. Nothing jumps to a kill switch.
            </p>
          </div>

          <ol className="flex flex-wrap gap-2 text-xs">
            {LOOP_STEPS.map((step, i) => (
              <li
                key={step}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-muted-foreground"
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <IllustrativeCallout />

        <KpiCards />

        <DashboardCharts />

        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              The inventory
            </h2>
            <p className="text-sm text-muted-foreground">
              The central artifact — search, filter, and sort to work the loop.
              Rising cost is shown in red, falling in green. Low-confidence owner
              guesses and unmapped line items are flagged so we never act blind.
            </p>
          </div>
          <InventoryTable />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function IllustrativeCallout() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-muted-foreground">
        <span className="font-medium text-foreground">
          Every figure, key, and team name here is an illustrative placeholder.
        </span>{" "}
        There is no real Storm Ideas invoice, key, or log data in this demo. The
        schema, the triage method, and the exports are what's real and ready to run
        against actual data on day one.
      </p>
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p>
          Built with Vite · React · Tailwind · shadcn/ui · Recharts — deployed on
          Firebase Hosting.
        </p>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          Source &amp; method on GitHub
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </footer>
  );
}

export default App;
