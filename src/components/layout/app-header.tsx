import { ChevronDown, Download, Menu, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "./user-menu";
import { useTheme } from "@/hooks/use-theme";
import { useAuth, useScopedRows } from "@/hooks/use-auth";
import { downloadCSV, downloadJSON } from "@/lib/export";
import { describeScope } from "@/data/org";

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const { role } = useAuth();
  const rows = useScopedRows();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenu}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          {role && (
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              <span className="font-medium text-foreground">{role.persona}</span> ·{" "}
              {describeScope(role.scope)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Download className="size-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Download your view</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => downloadCSV(rows)}>
                <Download className="size-4" />
                CSV (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => downloadJSON(rows)}>
                <Download className="size-4" />
                JSON (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
