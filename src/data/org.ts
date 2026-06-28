// Organisation, tenant, and pseudo-RBAC configuration.
//
// ⚠️ DEMO ONLY. This is a persona *switcher*, not real authentication or
// authorization. There are no passwords, no server, and no security boundary —
// a role only changes what this illustrative dashboard *shows* (its scope and
// which menu groups appear). Do not mistake it for an access-control system.

import type { Department, Region } from "@/data/inventory";

export const ORG = {
  /** Fictional tenant — a placeholder, not a real company. */
  name: "Acme Corp",
  shortName: "Acme",
  /** Reserved .example domain → clearly not a real address. */
  domain: "acme.example",
  product: "AI Spend Inventory",
} as const;

export type NavGroupId = "monitor" | "organisation" | "admin";

export const NAV_GROUP_LABEL: Record<NavGroupId, string> = {
  monitor: "Monitor",
  organisation: "Organisation",
  admin: "Admin",
};

export interface Scope {
  /** Departments this role can see, or "all". */
  departments: Department[] | "all";
  /** Regions this role can see, or "all". */
  regions: Region[] | "all";
}

export interface Role {
  /** Stable id — used in the login and persisted to localStorage. */
  id: string;
  /** Short persona label, e.g. "CFO". */
  persona: string;
  /** Display name of the (fictional) person. */
  name: string;
  /** Job title. */
  title: string;
  /** Team / function. */
  team: string;
  /** Generated sign-in email (reserved .example domain — not real). */
  email: string;
  /** What this role is allowed to see. */
  scope: Scope;
  /** Which sidebar groups are visible to this role. */
  groups: NavGroupId[];
  /** Where this role lands after signing in. */
  home: string;
  /** Can reach the Access & roles admin page. */
  admin?: boolean;
  /** One line on what they care about — shown on the login card. */
  blurb: string;
}

/**
 * The stakeholders from the brief, each turned into a one-click login. Scopes
 * demonstrate department-level and region-level pseudo-RBAC alongside
 * full-access finance/exec and a platform admin.
 */
export const ROLES: Role[] = [
  {
    id: "cfo",
    persona: "CFO",
    name: "Dana Okafor",
    title: "Chief Financial Officer",
    team: "Finance",
    email: "cfo@acme.example",
    scope: { departments: "all", regions: "all" },
    groups: ["monitor", "organisation"],
    home: "/cost",
    blurb: "Why did the bill jump — and who owns each line?",
  },
  {
    id: "coo",
    persona: "COO",
    name: "Marcus Webb",
    title: "Chief Operating Officer",
    team: "Executive",
    email: "coo@acme.example",
    scope: { departments: "all", regions: "all" },
    groups: ["monitor", "organisation"],
    home: "/",
    blurb: "One screen to keep control of spend and reliability.",
  },
  {
    id: "it-lead",
    persona: "Head of Platform",
    name: "Priya Nair",
    title: "Head of Platform & IT",
    team: "Platform",
    email: "platform@acme.example",
    scope: { departments: "all", regions: "all" },
    groups: ["monitor", "organisation", "admin"],
    home: "/reliability",
    admin: true,
    blurb: "What's failing — and what's safe to change.",
  },
  {
    id: "cloud-admin",
    persona: "Cloud Admin",
    name: "Sam Rivera",
    title: "Cloud Cost Administrator",
    team: "Platform",
    email: "cloudops@acme.example",
    scope: { departments: "all", regions: "all" },
    groups: ["monitor", "organisation"],
    home: "/cost",
    blurb: "Project-level spend and logs across every cloud.",
  },
  {
    id: "lead-content",
    persona: "Product Lead",
    name: "Lena Fischer",
    title: "Product Lead, Content",
    team: "Content",
    email: "content.lead@acme.example",
    scope: { departments: ["Content"], regions: "all" },
    groups: ["monitor", "organisation"],
    home: "/",
    blurb: "My team's AI workflows, spend, and health.",
  },
  {
    id: "region-emea",
    persona: "Regional Lead",
    name: "Tomás Alvarez",
    title: "Regional Operations Lead, EMEA",
    team: "Operations",
    email: "emea.ops@acme.example",
    scope: { departments: "all", regions: ["EMEA"] },
    groups: ["monitor", "organisation"],
    home: "/",
    blurb: "EMEA's AI footprint, end to end.",
  },
];

export function roleById(id: string | null | undefined): Role | undefined {
  return ROLES.find((r) => r.id === id);
}

/** Human-readable scope, e.g. "All departments · EMEA". */
export function describeScope(scope: Scope): string {
  const d =
    scope.departments === "all"
      ? "All departments"
      : scope.departments.join(", ");
  const r = scope.regions === "all" ? "All regions" : scope.regions.join(", ");
  return `${d} · ${r}`;
}
