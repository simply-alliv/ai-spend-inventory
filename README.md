# AI Spend Inventory

A lightweight, modern static dashboard that turns a fragmented AI/tooling **spend
surge** into an **owner-mapped, attributable, exportable** inventory — one row per
billing line item, joined across cloud billing, provider dashboards, and run logs.

It's the visual front-end for an operational take-home: **the problem isn't spend,
it's attribution.** The dashboard makes the estate legible, ranks the movers, and
keeps the bias toward reversible levers (caps, tiers, token limits) over kill
switches.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-radix--nova-000000)](https://ui.shadcn.com)
[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/docs/hosting)

> **Live demo:** https://ai-spend-inventory.web.app _(after the first deploy — see
> [Deploy](#deploy-to-firebase-hosting))_

---

## ⚠️ Illustrative data only

**Every figure, key, project, and team name in this app is a clearly-labelled
placeholder.** There is no real Storm Ideas invoice, key, or log data here. The
**schema**, the **triage method**, and the **exports** are what's real and ready to
run against actual data on day one. The illustrative dataset lives in a single typed
module: [`src/data/inventory.ts`](src/data/inventory.ts).

---

## What it shows

- **KPI strip** — total monthly spend, the surge vs. prior period, line items
  tracked (with unmapped / low-confidence counts), high-risk items, items needing
  action, and a "pauses so far" counter that makes the *reversible-first* posture
  visible.
- **Charts** (Recharts) — spend by surface (donut), top movers by Δ vs. prior
  (ranked bars), and this-period-vs-prior by surface (grouped bars).
- **The inventory table** — the central artifact. Search, filter by surface /
  decision, and sort by cost, Δ, or risk. Rising cost is red, falling is green;
  unmapped owners and low-confidence attributions are flagged so nothing is actioned
  blind.
- **Exports** — download the whole inventory as **CSV** or **JSON** (with derived
  deltas) for Finance, a sheet, or the weekly review.
- **Light / dark** theme, fully responsive, no backend — it's a static build.

## The data model

One row per billing line item, joined across every surface. The column rationale:

| Field | Meaning |
|---|---|
| `surface` | Where the spend appears (OpenAI / Gemini / Cloud billing / Run logs) |
| `lineItem` | Raw name as it appears on that surface |
| `monthlyCost` / `priorCost` | Current and prior period cost → the **delta** is derived |
| `workflow` / `owner` / `confidence` | Cost → what it does → who owns it (+ how sure) |
| `modelTier` / `rootCause` | The usual root cause and cheapest lever |
| `risk` / `decision` / `lever` / `status` | Triage → keep/fix/pause/investigate → reversible action → track to done |

## Tech stack & why

Chosen to be **lightweight and not distract from the goal** — a fast static site, no
server, no database:

- **Vite + React + TypeScript** — instant builds, a single static `dist/`.
- **Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)** (radix-nova preset, Geist
  font, Lucide icons) — accessible, composable components copied into the repo, so
  there's no heavy UI dependency to fight. This is the speed lever the brief asked
  for.
- **Recharts** — the charting primitives behind the shadcn chart component.
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

## Project structure

```
src/
  data/inventory.ts        # types + illustrative dataset (the single source of truth)
  lib/
    metrics.ts             # pure derivations: deltas, aggregates, formatters
    export.ts              # CSV / JSON download helpers
    utils.ts               # shadcn cn() helper
  hooks/use-theme.ts       # minimal light/dark toggle (no dependency)
  components/
    site-header.tsx        # title, theme toggle, export menu
    kpi-cards.tsx          # the KPI strip
    charts.tsx             # the three Recharts cards
    inventory-table.tsx    # the central, searchable/sortable table
    badges.tsx             # risk / decision / status / confidence chips + Δ indicator
    ui/                    # shadcn/ui components
  App.tsx                  # page composition
firebase.json / .firebaserc # Firebase Hosting config
```

## License

Provided as an interview/demonstration artifact. The illustrative data is fictional.
