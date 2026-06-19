import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { applicationsListQuery, deleteApplication, ALL_JOB_TYPES, ALL_STATUSES, JOB_TYPES, STATUSES, type Application, type JobType, type Status } from "@/lib/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { DeleteDialog } from "@/components/delete-dialog";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Search, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(5).max(50).catch(10),
  q: z.string().optional().catch(undefined),
  status: z.enum(ALL_STATUSES).catch("all"),
  jobType: z.enum(ALL_JOB_TYPES).catch("all"),
});

type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/applications/")({
  head: () => ({ meta: [{ title: "Applications · TrackSathi" }] }),
  validateSearch: searchSchema,
  component: ApplicationsList,
});

function ApplicationsList() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const qc = useQueryClient();

  const [draft, setDraft] = useState(search.q ?? "");
  useEffect(() => { setDraft(search.q ?? ""); }, [search.q]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== draft) {
        navigate({ search: (prev: SearchParams) => ({ ...prev, q: draft || undefined, page: 1 }) });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useQuery(applicationsListQuery({
    page: search.page, limit: search.limit, search: search.q,
    status: search.status as Status | "all", jobType: search.jobType as JobType | "all",
  }));

  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / search.limit)) : 1;

  const del = useMutation({
    mutationFn: (id: string) => deleteApplication({ data: id }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["applications"] });
      const prev = qc.getQueriesData<{ rows: Application[]; total: number }>({ queryKey: ["applications", "list"] });
      prev.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, { ...data, rows: data.rows.filter((r) => r.id !== id), total: Math.max(0, data.total - 1) });
      });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      ctx?.prev.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Failed to delete application");
    },
    onSuccess: () => {
      toast.success("Application deleted");
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-primary">All Applications</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.data ? `${list.data.total} total` : "Loading…"} · search, filter and manage your pipeline.
          </p>
        </div>
        <Button asChild className="gap-1.5"><Link to="/applications/new"><Plus className="h-4 w-4" /> Add Application</Link></Button>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_120px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or job title…"
              className="pl-9"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>
          <Select value={search.status} onValueChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, status: v as Status | "all", page: 1 }) })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={search.jobType} onValueChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, jobType: v as JobType | "all", page: 1 }) })}>
            <SelectTrigger><SelectValue placeholder="Job type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {JOB_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(search.limit)} onValueChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, limit: Number(v), page: 1 }) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 20, 30, 50].map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (list.data?.rows.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0"><EmptyState /></TableCell>
                </TableRow>
              ) : (
                list.data!.rows.map((r) => (
                  <TableRow key={r.id} className="group">
                    <TableCell className="font-medium">{r.company_name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.job_title}</TableCell>
                    <TableCell><span className="text-xs rounded-md border border-border bg-muted/50 px-2 py-0.5">{r.job_type}</span></TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(parseISO(r.applied_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(parseISO(r.created_at), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="View"><Link to="/applications/$id" params={{ id: r.id }}><Eye className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" asChild title="Edit"><Link to="/applications/$id/edit" params={{ id: r.id }}><Pencil className="h-4 w-4" /></Link></Button>
                        <DeleteDialog
                          trigger={<Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></Button>}
                          onConfirm={() => del.mutate(r.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {list.data && list.data.total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-muted-foreground">
            Showing <span className="text-foreground font-medium">{(search.page - 1) * search.limit + 1}</span>–
            <span className="text-foreground font-medium">{Math.min(search.page * search.limit, list.data.total)}</span> of{" "}
            <span className="text-foreground font-medium">{list.data.total}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={search.page <= 1}
              onClick={() => navigate({ search: (p: SearchParams) => ({ ...p, page: p.page - 1 }) })}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
              const n = i + 1;
              return (
                <Button key={n} variant={n === search.page ? "default" : "outline"} size="sm"
                  onClick={() => navigate({ search: (p: SearchParams) => ({ ...p, page: n }) })}>
                  {n}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={search.page >= totalPages}
              onClick={() => navigate({ search: (p: SearchParams) => ({ ...p, page: p.page + 1 }) })}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
