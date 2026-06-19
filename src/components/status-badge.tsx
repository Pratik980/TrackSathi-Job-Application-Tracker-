import { cn } from "@/lib/utils";
import type { Status } from "@/lib/applications";

const STYLES: Record<Status, string> = {
  Applied: "bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-300",
  Interviewing: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300",
  Offer: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300",
  Rejected: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
