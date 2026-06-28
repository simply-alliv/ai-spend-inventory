import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { describeScope, NAV_GROUP_LABEL, ROLES } from "@/data/org";

export function AccessPage() {
  return (
    <>
      <PageHeader
        title="Access & roles"
        description="The stakeholder logins and what each persona is scoped to see."
      />

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Pseudo-RBAC — demo only</p>
            <p className="text-sm text-muted-foreground">
              These personas are a one-click switcher, not real authentication.
              There are no passwords and no security boundary — a role only changes
              what this illustrative dashboard <em>shows</em> (its data scope and which
              menu groups appear). Wire real SSO / RBAC before pointing it at live
              data.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Persona</TableHead>
                  <TableHead>Sign-in</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Menu access</TableHead>
                  <TableHead>Lands on</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLES.map((role) => (
                  <TableRow key={role.id} className="align-top">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {role.persona}
                        </Badge>
                        {role.admin && (
                          <Badge
                            variant="outline"
                            className="border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-700 dark:text-violet-400"
                          >
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{role.title}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {role.email}
                    </TableCell>
                    <TableCell className="text-xs">{describeScope(role.scope)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {role.groups.map((g) => NAV_GROUP_LABEL[g]).join(" · ")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {role.home}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
