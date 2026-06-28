# AI Spend Inventory — an AI Operations dashboard

A lightweight, modern static dashboard that turns a fragmented AI/tooling **spend
surge** into an **owner-mapped, attributable** operations view — one row per billing
line item, joined across cloud billing, provider dashboards, and run logs, and read
through **two lenses at once: cost _and_ reliability.** It's a multi-page internal
tool: a **sidebar** groups the pages, **departments** and **regions** get their own
rollups, and a **pseudo-RBAC persona switcher** gives each stakeholder (CFO, COO, IT,
Cloud Admin, Product Lead, Regional Lead) a one-click, scoped login.

> **The reframe, in one line** *(this used to be the dashboard's hero — it lives here
> now):*
>
> **We don't have a spend problem. We have an attribution problem that shows up as
> spend.** One row per billing line item, joined across cloud billing, provider
> dashboards, and run logs — so spend can be tied to a workflow, an owner, and now its
> reliability: success rate, latency, and unit cost per call. Rank by movement,
> attribute the few big movers, watch which automations are failing, and reach for the
> most reversible lever first. Nothing jumps to a kill switch.

That reframe drives the whole layout: **the problem isn't spend, it's attribution** —
and, it turns out, the surge's single biggest driver is a *failing* automation paying
for work that never lands. The dashboard makes the estate legible, ranks the movers,
surfaces the broken automations, and keeps the bias toward reversible levers (caps,
tiers, token limits) over kill switches.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-radix--nova-000000)](https://ui.shadcn.com)
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs/hosting)

> **Live demo:** **<https://ai-spend-inventory.web.app>** — deployed on Firebase Hosting.

---

## ⚠️ Illustrative data only

**Every figure, key, project, team, department, and region in this app is a
clearly-labelled placeholder for a fictional tenant ("Acme Corp").** There is no real
customer invoice, key, or log data here, and the persona logins are demo-only (no
passwords, no real auth). The **schema**, the **triage method**, the **derived
metrics**, and the **exports** are what's real and ready to run against actual data on
day one. The illustrative dataset lives in a single typed module:
[`src/data/inventory.ts`](src/data/inventory.ts).

---

## What a good AI Operations dashboard tracks (the CTO way)

A CFO asks *"why did the bill jump?"* A CTO also asks *"is it actually working, and
what breaks if I stop it?"* Grounded in the FinOps Foundation's **FinOps for AI**
guidance (see [references](#references)) and standard LLM-observability practice, this
dashboard tracks four lenses so both questions get answered on one screen:

| Lens | Question it answers | Signals on the dashboard |
|---|---|---|
| **1. Cost & attribution** | Whose spend is this, and what moved? | spend, Δ vs prior, owner + confidence, unmapped %, surge concentration |
| **2. Reliability / automation health** | Is it working — or paying for failures? | success rate, p95 latency, derived **health**, spend-at-risk |
| **3. Unit economics** | Is each call *efficiently* priced? | calls, tokens, **cost per call**, **$ / 1k calls**, over-tiered flags |
| **4. Trend** | Is this a step change or a slow creep? | trailing 6-month spend, this-vs-prior by surface |

The thesis the layout encodes: **you can't govern what you can't see or attribute —
and cost alone is only half the picture.** Reliability is the other half.

---

## Sign in & navigation (pseudo-RBAC)

The app opens on a **persona picker** — pick a stakeholder and you're signed in (the
choice persists in `localStorage`). It is a **demo persona switcher, not real auth**:
no password, no server, no security boundary. A role only changes *what the dashboard
shows* — its data **scope** and which **menu groups** appear. Wire real SSO / RBAC
before pointing it at live data.

| Persona | Scope | Menu access | Lands on |
|---|---|---|---|
| **CFO** — Finance | All departments · All regions | Monitor · Organisation | Cost & attribution |
| **COO** — Executive | All · All | Monitor · Organisation | Overview |
| **Head of Platform** — IT | All · All | Monitor · Organisation · **Admin** | Reliability |
| **Cloud Admin** | All · All | Monitor · Organisation | Cost & attribution |
| **Product Lead, Content** | **Content** · All regions | Monitor · Organisation | Overview |
| **Regional Lead, EMEA** | All departments · **EMEA** | Monitor · Organisation | Overview |

Every page filters to the active role's scope (e.g. the Content lead's totals only
include Content workflows). Roles live in [`src/data/org.ts`](src/data/org.ts); scope
filtering in [`src/lib/rbac.ts`](src/lib/rbac.ts).

**The pages, grouped in the sidebar:**

- **Monitor** — **Overview** (KPIs + key charts), **Cost & attribution** (breakdown,
  movers, trend, cost table), **Reliability** (scatter, automation health, usage table).
- **Organisation** — **Departments** and **Regions** (spend + health rollups, the
  "more granular" slices), **Inventory** (the full table, both views).
- **Admin** — **Access & roles** (the persona logins and their scopes; admin-only).

---

## What it shows

- **Sidebar navigation + persona scope** — grouped pages (Monitor / Organisation /
  Admin) and a one-click stakeholder login that scopes every figure to that role.
- **Key-finding bar** — the one-line answer, derived live: how concentrated the surge
  is, how much spend is unmapped, and how much flows through *failing* automations.
- **KPI strip (8 cards, both lenses)** — total spend & annualized run-rate, % spend
  attributed, items needing action; then blended success rate, failing automations,
  spend-at-risk, and revenue-critical workflows that aren't healthy.
- **Charts** (Recharts) — spend breakdown (donut, switchable by surface / health /
  criticality / decision), top movers by Δ, this-vs-prior by surface, a **6-month
  spend trend** (the surge is a step, not a creep), and a **cost-vs-reliability
  scatter** where *bottom-right = expensive and failing → fix first*.
- **Automation health panel** — every not-healthy automation, worst first, with
  success rate, p95 latency, volume, unit cost, root cause, and the reversible lever.
- **The inventory table** — the central artifact, with two views: **Cost &
  attribution** (owner, Δ, risk, decision, lever) and **Reliability & usage** (health,
  calls, success, p95, tokens, $/1k calls). Search, filter, and sort either lens.
- **Exports** — download the whole inventory as **CSV** or **JSON**, now including the
  derived health, error rate, and unit-economics columns, for Finance or the review.
- **Light / dark** theme, fully responsive, no backend — it's a static build.

## The data model

One row per billing line item, joined across every surface — now carrying both
**attribution** columns and **operational signals**, so the same row can be read for
cost *or* reliability. Full types in [`src/data/inventory.ts`](src/data/inventory.ts).

**Attribution & triage**

| Field | Meaning |
|---|---|
| `surface` | Where the spend appears (OpenAI / Gemini / Cloud billing / Run logs) |
| `lineItem` | Raw name as it appears on that surface |
| `monthlyCost` / `priorCost` | Current and prior cost → the **delta** is derived |
| `workflow` / `owner` / `confidence` | Cost → what it does → who owns it (+ how sure) |
| `modelTier` / `rootCause` | The usual root cause and cheapest lever |
| `risk` / `decision` / `lever` / `status` | Triage → keep/fix/pause/investigate → reversible action → track to done |

**Operational signals (the reliability lens)**

| Field | Meaning |
|---|---|
| `calls` | Monthly request / run volume → drives unit economics |
| `tokensM` | Tokens consumed (millions); `null` for non-token surfaces |
| `successRate` / `latencyMsP95` | Did it work, and how fast (p95) |
| `env` / `criticality` / `cadence` | Where it runs / blast radius if stopped / how it executes |
| `history` | Trailing 6-month cost, for the trend chart |
| `department` / `region` | Allocation dimensions — power the Departments & Regions rollups and the pseudo-RBAC scope |

### How the insights are derived

None of the health or efficiency labels are hard-coded — they're computed from the raw
signals in [`src/lib/metrics.ts`](src/lib/metrics.ts), so they stay honest when the
data changes:

- **`opsHealth`** — `failing` when success < 90%; `degraded` when success < 98% **or**
  p95 latency > 4s; else `healthy`.
- **Unit economics** — `costPerCall`, `costPer1kCalls`, `costPerMTok` expose the
  *over-tiered* items (a premium tier doing a cheap job).
- **`wastedSpend`** — `error_rate × cost`, summed: what the estate pays for failed work.
- **Spend-weighted attribution** — unmapped %, surge concentration, and revenue-at-risk
  are all spend-weighted, so the headline is a dollar figure, not a row count.

## Tech stack & why

Chosen to be **lightweight and not distract from the goal** — a fast static site, no
server, no database:

- **Vite + React + TypeScript** — instant builds, a single static `dist/`.
- **Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)** (radix-nova preset, Geist
  font, Lucide icons) — accessible, composable components copied into the repo, so
  there's no heavy UI dependency to fight. This is the speed lever the brief asked
  for.
- **Recharts** — the charting primitives behind the shadcn chart component.
- **React Router** — client-side routing for the grouped, multi-page layout.
- **Firebase Hosting** — one-command deploy of the static build to a global CDN.

## Getting started

Prerequisites: **Node 20+** and npm.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # serve the production build locally (http://localhost:4173)
```

## Deploy to Firebase Hosting

Hosting is pre-configured in [`firebase.json`](firebase.json) (serves `dist/`, SPA
rewrite, long-cache for hashed assets) and [`.firebaserc`](.firebaserc) (default
project alias `ai-spend-inventory`). Full walkthrough in
[`docs/DEPLOY.md`](docs/DEPLOY.md). Short version:

```bash
npm install -g firebase-tools     # if not already installed
firebase login                    # authenticate

# Create the project once (or do it in the Firebase console). Project IDs are
# globally unique — if "ai-spend-inventory" is taken, pick another and update
# .firebaserc.
firebase projects:create ai-spend-inventory --display-name "AI Spend Inventory"

npm run build                     # produce dist/
firebase deploy --only hosting    # ship it
```

The deployed site is served at `https://<project-id>.web.app`.

## Continuous deployment (CI/CD)

Every push and pull request runs
[`.github/workflows/firebase-deploy.yml`](.github/workflows/firebase-deploy.yml):

1. **Checks** — `npm ci`, `npm run lint` (oxlint), and `npm run build` (type-check +
   Vite build) on Node 24, on every push and pull request.
2. **Deploy** — on a push to `main`, the verified build is deployed to the Firebase
   Hosting **live** channel.

Deploys authenticate with a least-privilege Google service account stored as the
encrypted `FIREBASE_SERVICE_ACCOUNT` GitHub Actions secret (roles: Firebase Hosting
Admin + Firebase Viewer). The manual `firebase deploy` flow above still works for local
one-off releases.

## Project structure

```
src/
  data/
    inventory.ts           # types + illustrative dataset (the single source of truth)
    org.ts                 # tenant, departments/regions, and the pseudo-RBAC roles
  lib/
    metrics.ts             # pure derivations: deltas, health, unit economics, trend, rollups
    rbac.ts                # scope filtering (which rows a role may see)
    export.ts              # CSV / JSON download helpers (incl. derived columns)
    utils.ts               # shadcn cn() helper
  hooks/
    use-theme.ts           # minimal light/dark toggle
    use-auth.tsx           # persona session + scoped-inventory hook (localStorage)
  components/
    layout/                # app shell: sidebar, header, user menu, page header, nav config
    insight-bar.tsx        # the one-line, live-derived key finding
    kpi-cards.tsx          # the 8-card KPI strip (cost + reliability)
    charts.tsx             # breakdown, top movers, surface trend, 6-mo trend, cost-vs-reliability scatter
    reliability-panel.tsx  # "Automation health" — not-healthy automations, worst first
    inventory-table.tsx    # the central table, with Cost and Reliability views
    rollup-view.tsx        # generic spend + health rollup (departments / regions)
    badges.tsx             # risk / decision / status / confidence / health chips + Δ indicator
    ui/                    # shadcn/ui components
  pages/                   # one file per route (overview, cost, reliability, departments, regions, inventory, access, login)
  App.tsx                  # routes + auth guards
  main.tsx                 # providers: BrowserRouter + AuthProvider
firebase.json / .firebaserc # Firebase Hosting config
```

## References

The metric design follows the FinOps Foundation's **FinOps for AI** guidance —
cost-per-token / per-call unit economics, showback & attribution, anomaly detection,
and matching the model tier to the job — extended with standard LLM-observability
signals (success rate, p95 latency, derived health). See the FinOps Foundation,
*FinOps for AI Overview* (<https://www.finops.org/wg/finops-for-ai-overview/>).

## License

Provided as a demonstration artifact. The illustrative data is fictional.
