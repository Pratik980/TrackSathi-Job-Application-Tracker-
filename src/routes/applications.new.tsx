import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApplicationForm } from "@/components/application-form";
import { createApplication, type ApplicationInput } from "@/lib/applications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/applications/new")({
  head: () => ({ meta: [{ title: "New Application · TrackSathi" }] }),
  component: NewApplication,
});

function NewApplication() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (input: ApplicationInput) => createApplication({ data: input }),
    onSuccess: (created) => {
      toast.success("Application created successfully");
      qc.invalidateQueries({ queryKey: ["applications"] });
      navigate({ to: "/applications/$id", params: { id: created.id } });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create application"),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2"><Link to="/applications"><ArrowLeft className="h-4 w-4" /> Back to applications</Link></Button>
        <h1 className="mt-3 font-display text-3xl md:text-4xl">New Application</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log a new job application to your pipeline.</p>
      </div>
      <Card className="p-6 md:p-8">
        <ApplicationForm onSubmit={(v) => mut.mutate(v)} submitting={mut.isPending} submitLabel="Create Application" />
      </Card>
    </div>
  );
}
