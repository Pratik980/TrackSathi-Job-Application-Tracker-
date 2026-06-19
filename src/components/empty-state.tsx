import { Link } from "@tanstack/react-router";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title = "No applications found.",
  description = "Start tracking your job search by adding your first application.",
  action = true,
}: { title?: string; description?: string; action?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-xl">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button asChild className="mt-6 gap-1.5">
          <Link to="/applications/new"><Plus className="h-4 w-4" /> Add Application</Link>
        </Button>
      )}
    </div>
  );
}
