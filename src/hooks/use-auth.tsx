// Pseudo-RBAC session state. Persists the chosen persona to localStorage and
// exposes the active role + a scoped view of the inventory.
//
// ⚠️ DEMO ONLY — no real auth. See data/org.ts.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { INVENTORY } from "@/data/inventory";
import { roleById, type Role } from "@/data/org";
import { scopeRows } from "@/lib/rbac";

const STORAGE_KEY = "ai-spend-role";

interface AuthValue {
  role: Role | null;
  signIn: (id: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (roleId) localStorage.setItem(STORAGE_KEY, roleId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [roleId]);

  const value = useMemo<AuthValue>(
    () => ({
      role: roleById(roleId) ?? null,
      signIn: (id) => setRoleId(id),
      signOut: () => setRoleId(null),
    }),
    [roleId],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** The inventory the current role is allowed to see (all rows if signed out). */
export function useScopedRows() {
  const { role } = useAuth();
  return useMemo(
    () => (role ? scopeRows(INVENTORY, role.scope) : INVENTORY),
    [role],
  );
}
