import { NavLink } from "react-router-dom";
import { ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { describeScope, NAV_GROUP_LABEL, ORG } from "@/data/org";
import { NAV } from "./nav";

/** Inner sidebar content — positioned (fixed / drawer) by the layout. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  const groups = NAV.filter((g) => role?.groups.includes(g.id));

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ReceiptText className="size-4.5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">{ORG.product}</div>
          <div className="text-xs text-muted-foreground">{ORG.name}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {NAV_GROUP_LABEL[group.id]}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t p-3">
        {role && (
          <div className="rounded-md bg-muted/50 px-2.5 py-2 text-xs">
            <div className="font-medium text-foreground">Your view</div>
            <div className="text-muted-foreground">{describeScope(role.scope)}</div>
          </div>
        )}
        <Badge
          variant="outline"
          className="w-full justify-center border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        >
          Illustrative data
        </Badge>
      </div>
    </div>
  );
}
