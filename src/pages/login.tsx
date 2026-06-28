import { useNavigate } from "react-router-dom";
import { ArrowRight, ReceiptText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { describeScope, ORG, ROLES, type Role } from "@/data/org";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function choose(role: Role) {
    signIn(role.id);
    navigate(role.home);
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center px-4 py-10 sm:px-6">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ReceiptText className="size-5" />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">
                {ORG.product}
              </span>
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                Illustrative data
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">{ORG.name}</span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Choose a stakeholder to continue
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          One click signs you in as that persona. This is a{" "}
          <strong className="font-medium text-foreground">pseudo-RBAC demo</strong> —
          there is no password, and a role only changes what the dashboard shows (its
          data scope and which menu groups appear).
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => choose(role)}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {initials(role.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{role.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {role.persona}
                    </Badge>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {role.title}
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{role.blurb}</p>
              <div className="mt-auto flex items-center justify-between pt-1 text-xs">
                <span className="text-muted-foreground">
                  {describeScope(role.scope)}
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Continue
                  <ArrowRight className="size-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Every figure, name, and email here is a clearly-labelled placeholder for a
          fictional tenant ({ORG.name}). No real invoice, key, or log data is included.
        </p>
      </div>
    </div>
  );
}
