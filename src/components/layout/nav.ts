// Sidebar navigation, grouped. Pure data (no JSX) so it stays fast-refresh-safe.

import {
  Activity,
  Building2,
  Globe,
  KeyRound,
  LayoutDashboard,
  Table2,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { NavGroupId } from "@/data/org";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Exact-match active state (used for the index route). */
  end?: boolean;
}

export interface NavGroup {
  id: NavGroupId;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    id: "monitor",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
      { to: "/cost", label: "Cost & attribution", icon: Wallet },
      { to: "/reliability", label: "Reliability", icon: Activity },
    ],
  },
  {
    id: "organisation",
    items: [
      { to: "/departments", label: "Departments", icon: Building2 },
      { to: "/regions", label: "Regions", icon: Globe },
      { to: "/inventory", label: "Inventory", icon: Table2 },
    ],
  },
  {
    id: "admin",
    items: [{ to: "/access", label: "Access & roles", icon: KeyRound }],
  },
];
