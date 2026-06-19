import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { applicationsListQuery, statsQuery, type Application } from "@/lib/applications";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ArrowRight, Briefcase, CheckCircle2, FileText, Plus, TrendingUp, XCircle, Clock } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · TrackSathi" },
      { name: "description", content: "Overview of your job applications: totals by status and recent activity." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(statsQuery());
    context.queryClient.ensureQueryData(applicationsListQuery({ page: 1, limit: 5 }));
  },
  component: DashboardPage,
  errorComponent: ({ error }) => (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

const COLORS: Record<string, string> = {
  Applied: "#3b82f6",
  Interviewing: "#f59e0b",
  Offer: "#10b981",
  Rejected: "#f43f5e",
};

function DashboardPage() {
  const stats = useQuery(statsQuery());
  const recent = useQuery(applicationsListQuery({ page: 1, limit: 5 }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">Overview</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">A snapshot of your job-search pipeline.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/applications">View All <ArrowRight className="h-4 w-4" /></Link></Button>
          <Button asChild className="gap-1.5"><Link to="/applications/new"><Plus className="h-4 w-4" /> Add Application</Link></Button>
        </div>
      </div>

      {/* Stat grid */}
      {stats.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : stats.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total" value={stats.data.total} icon={Briefcase} hint="All applications" />
          <StatCard label="Applied" value={stats.data.byStatus.Applied} icon={FileText} accent="blue" />
          <StatCard label="Interviewing" value={stats.data.byStatus.Interviewing} icon={Clock} accent="amber" />
          <StatCard label="Offer" value={stats.data.byStatus.Offer} icon={CheckCircle2} accent="emerald" />
          <StatCard label="Rejected" value={stats.data.byStatus.Rejected} icon={XCircle} accent="rose" />
        </div>
      ) : null}

      {/* Chart + Recent */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Distribution</p>
              <h2 className="mt-1 font-display text-xl">Application Status</h2>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-6 h-[260px]">
            {stats.isLoading ? (
              <Skeleton className="h-full w-full rounded-md" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.data?.chart ?? []} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="status" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                  <YAxis allowDecimals={false} stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} className="text-muted-foreground" />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(stats.data?.chart ?? []).map((d) => <Cell key={d.status} fill={COLORS[d.status]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Latest</p>
              <h2 className="mt-1 font-display text-xl">Recent Applications</h2>
            </div>
            <Button variant="ghost" size="sm" asChild><Link to="/applications">View all</Link></Button>
          </div>
          <div className="mt-4 space-y-2">
            {recent.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-md" />)
            ) : (recent.data?.rows.length ?? 0) === 0 ? (
              <EmptyState />
            ) : (
              recent.data!.rows.map((r: Application) => (
                <Link
                  key={r.id}
                  to="/applications/$id"
                  params={{ id: r.id }}
                  className="flex items-center justify-between rounded-md border border-border/70 bg-card/40 p-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.job_title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {r.company_name} · {format(parseISO(r.applied_date), "MMM d, yyyy")}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
