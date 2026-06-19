import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationQuery, deleteApplication } from "@/lib/applications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { DeleteDialog } from "@/components/delete-dialog";
import { ArrowLeft, Pencil, Trash2, Calendar, Briefcase, Building2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/applications/$id/")({
  head: () => ({ meta: [{ title: "Application · TrackSathi" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(applicationQuery(params.id)),
  component: ViewApplication,
  errorComponent: ({ error }) => (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</div>
  ),
});

function ViewApplication() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(applicationQuery(id));

  const del = useMutation({
    mutationFn: () => deleteApplication({ data: id }),
    onSuccess: () => {
      toast.success("Application deleted");
      qc.invalidateQueries({ queryKey: ["applications"] });
      navigate({ to: "/applications" });
    },
    onError: () => toast.error("Failed to delete"),
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2"><Link to="/applications"><ArrowLeft className="h-4 w-4" /> Back</Link></Button>

      <Card className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">{data.company_name}</p>
            <h1 className="mt-2 font-display text-3xl md:text-4xl">{data.job_title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge status={data.status} />
              <span className="text-xs rounded-md border border-border bg-muted/50 px-2 py-0.5">{data.job_type}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-1.5"><Link to="/applications/$id/edit" params={{ id }}><Pencil className="h-4 w-4" /> Edit</Link></Button>
            <DeleteDialog
              trigger={<Button variant="outline" className="gap-1.5 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /> Delete</Button>}
              onConfirm={() => del.mutate()}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Detail icon={Building2} label="Company">{data.company_name}</Detail>
          <Detail icon={Briefcase} label="Job Type">{data.job_type}</Detail>
          <Detail icon={Calendar} label="Applied Date">{format(parseISO(data.applied_date), "MMMM d, yyyy")}</Detail>
          <Detail icon={Clock} label="Added">{format(parseISO(data.created_at), "MMMM d, yyyy · p")}</Detail>
        </div>

        {data.notes && (
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Notes</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{data.notes}</p>
          </div>
        )}

        <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          Last updated {format(parseISO(data.updated_at), "MMM d, yyyy · p")}
        </div>
      </Card>
    </div>
  );
}

function Detail({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-sm font-medium">{children}</div>
    </div>
  );
}
