import { useNavigate } from "react-router-dom";
import { LogOut, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { describeScope } from "@/data/org";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();

  if (!role) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials(role.name)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-xs font-medium">{role.name}</span>
            <span className="block text-[11px] text-muted-foreground">
              {role.persona}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="font-medium">{role.name}</div>
          <div className="text-xs font-normal text-muted-foreground">
            {role.title}
          </div>
          <div className="mt-0.5 text-xs font-normal text-muted-foreground">
            {role.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs">
          <div className="font-medium text-foreground">Scope</div>
          <div className="text-muted-foreground">{describeScope(role.scope)}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/login")}>
          <Repeat className="size-4" />
          Switch persona
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            signOut();
            navigate("/login");
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
