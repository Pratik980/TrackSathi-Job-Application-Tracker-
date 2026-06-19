import { Link, useRouterState } from "@tanstack/react-router";
import { Briefcase, LayoutDashboard, ListChecks, Moon, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/applications", label: "Applications", icon: ListChecks, exact: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar - fixed on desktop, in-flow on mobile */}
      <aside className="border-b lg:border-b-0 lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:flex-col border-border bg-card/40 backdrop-blur">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg">TrackSathi</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Job Applications</div>
          </div>
        </div>
        <nav className="flex lg:flex-col gap-1 p-3 overflow-x-auto lg:overflow-y-auto lg:flex-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden lg:block px-6 py-4 border-t border-border">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">Intern Assignment</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur">
          <div className="text-sm text-muted-foreground hidden md:block">
            Track every application from <span className="text-foreground font-medium">Applied</span> to <span className="text-foreground font-medium">Offer</span>.
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button asChild size="sm" className="gap-1.5">
              <Link to="/applications/new"><Plus className="h-4 w-4" /> New Application</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
