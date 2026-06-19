import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

export const JOB_TYPES = ["Internship", "Full-time", "Part-time"] as const;
export const STATUSES = ["Applied", "Interviewing", "Offer", "Rejected"] as const;

export const ALL_JOB_TYPES = ["all", ...JOB_TYPES] as const;
export const ALL_STATUSES = ["all", ...STATUSES] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type Status = (typeof STATUSES)[number];

export type Application = {
  id: string;
  company_name: string;
  job_title: string;
  job_type: JobType;
  status: Status;
  applied_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const applicationSchema = z.object({
  company_name: z.string().trim().min(2, "Company name must be at least 2 characters").max(120),
  job_title: z.string().trim().min(2, "Job title is required").max(120),
  job_type: z.enum(JOB_TYPES),
  status: z.enum(STATUSES),
  applied_date: z.string().min(1, "Applied date is required"),
  notes: z.string().max(2000).optional().nullable(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export type ListParams = {
  page: number;
  limit: number;
  search?: string;
  status?: Status | "all";
  jobType?: JobType | "all";
};

export type ListResult = {
  rows: Application[];
  total: number;
  page: number;
  limit: number;
};

export const idSchema = z.string().uuid();

const listParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(ALL_STATUSES).optional(),
  jobType: z.enum(ALL_JOB_TYPES).optional(),
});

export const listApplications = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => listParamsSchema.parse(data))
  .handler(async ({ data: params }) => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { page, limit, search, status, jobType } = params;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let q = supabase.from("applications").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    if (jobType && jobType !== "all") q = q.eq("job_type", jobType);
    if (search?.trim()) {
      const s = search.trim().toLowerCase();
      q = q.or(`company_name.ilike.%${s}%,job_title.ilike.%${s}%`);
    }
    q = q.range(from, to);

    const { data, error, count } = await q;
    if (error) {
      console.error("[API] listApplications error:", error);
      throw new Error(error.message);
    }
    return { rows: (data ?? []) as Application[], total: count ?? 0, page, limit } satisfies ListResult;
  });

export const getApplication = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data: id }) => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabase.from("applications").select("*").eq("id", id).single();
    if (error) {
      console.error("[API] getApplication error:", error);
      throw new Error(error.message);
    }
    return data as Application;
  });

export const createApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => applicationSchema.parse(data))
  .handler(async ({ data: input }) => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabase.from("applications").insert(input).select().single();
    if (error) {
      console.error("[API] createApplication error:", error);
      throw new Error(error.message);
    }
    return data as Application;
  });

export const updateApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: idSchema, input: applicationSchema.partial() }).parse(data))
  .handler(async ({ data: { id, input } }) => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabase.from("applications").update(input).eq("id", id).select().single();
    if (error) {
      console.error("[API] updateApplication error:", error);
      throw new Error(error.message);
    }
    return data as Application;
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data: id }) => {
    const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) {
      console.error("[API] deleteApplication error:", error);
      throw new Error(error.message);
    }
  });

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin: supabase } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabase.from("applications").select("status, applied_date, created_at");
  if (error) {
    console.error("[API] getStats error:", error);
    throw new Error(error.message);
  }
  const rows = (data ?? []) as Pick<Application, "status" | "applied_date" | "created_at">[];
  const by: Record<string, number> = { Applied: 0, Interviewing: 0, Offer: 0, Rejected: 0 };
  for (const r of rows) {
    const s = r.status as string;
    if (s in by) by[s]++;
  }
  return {
    total: rows.length,
    byStatus: by as Record<Status, number>,
    chart: STATUSES.map((s) => ({ status: s, count: by[s] })),
  };
});

// -- TanStack Query option helpers --

export const applicationsListQuery = (params: ListParams) =>
  queryOptions({
    queryKey: ["applications", "list", params],
    queryFn: () => listApplications({ data: params }),
  });

export const applicationQuery = (id: string) =>
  queryOptions({
    queryKey: ["applications", "detail", id],
    queryFn: () => getApplication({ data: id }),
  });

export const statsQuery = () =>
  queryOptions({
    queryKey: ["applications", "stats"],
    queryFn: () => getStats(),
  });
