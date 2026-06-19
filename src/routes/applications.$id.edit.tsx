import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationQuery, updateApplication, type ApplicationInput } from "@/lib/applications";
import { ApplicationForm } from "@/components/application-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/applications/$id/edit")({
  head: () => ({ meta: [{ title: "Edit Application · TrackSathi" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(applicationQuery(params.id)),
  component: EditApplication,
  errorComponent: ({ error }) => (
    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{error.message}</div>
  ),
});

function EditApplication() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(applicationQuery(id));

  const mut = useMutation({
    mutationFn: (input: ApplicationInput) => updateApplication({ data: { id, input } }),
    onSuccess: () => {
      toast.success("Application updated successfully");
      qc.invalidateQueries({ queryKey: ["applications"] });
      navigate({ to: "/applications/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to update"),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2"><Link to="/applications/$id" params={{ id }}><ArrowLeft className="h-4 w-4" /> Back</Link></Button>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">Edit Application</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update the details for this application.</p>
      </div>
      <Card className="p-6 md:p-8">
        {isLoading || !data ? (
          <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <ApplicationForm
            defaultValues={{
              company_name: data.company_name,
              job_title: data.job_title,
              job_type: data.job_type,
              status: data.status,
              applied_date: data.applied_date,
              notes: data.notes ?? "",
            }}
            onSubmit={(v) => mut.mutate(v)}
            submitting={mut.isPending}
            submitLabel="Save Changes"
          />
        )}
      </Card>
    </div>
  );
}
