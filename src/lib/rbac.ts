// Pseudo-RBAC scope filtering. Pure functions over the inventory — given a
// role's Scope, return only the rows that role is allowed to see.
//
// ⚠️ DEMO ONLY: this shapes what the dashboard *displays*; it is not a security
// boundary. See data/org.ts.

import type { InventoryRow } from "@/data/inventory";
import type { Scope } from "@/data/org";

export function inScope(row: InventoryRow, scope: Scope): boolean {
  const deptOk =
    scope.departments === "all" || scope.departments.includes(row.department);
  const regionOk =
    scope.regions === "all" || scope.regions.includes(row.region);
  return deptOk && regionOk;
}

export function scopeRows(rows: InventoryRow[], scope: Scope): InventoryRow[] {
  return rows.filter((row) => inScope(row, scope));
}
