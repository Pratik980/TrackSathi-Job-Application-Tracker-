import { z } from "zod";
import type { Application, ApplicationInput, ListResult } from "@/lib/applications";
import { applicationSchema, idSchema, ALL_STATUSES, ALL_JOB_TYPES } from "@/lib/applications";
import { supabaseAdmin } from "@/lib/supabase.server";

const listParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(ALL_STATUSES).optional(),
  jobType: z.enum(ALL_JOB_TYPES).optional(),
});

export async function list(query: URLSearchParams): Promise<ListResult> {
  const params = listParamsSchema.parse(Object.fromEntries(query));
  const supabase = supabaseAdmin;
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
    throw new Error(error.message);
  }
  return { rows: (data ?? []) as Application[], total: count ?? 0, page, limit };
}

export async function getById(id: string): Promise<Application> {
  const parsed = idSchema.parse(id);
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("applications").select("*").eq("id", parsed).single();
  if (error) {
    throw new Error(error.message);
  }
  return data as Application;
}

export async function create(input: ApplicationInput): Promise<Application> {
  const parsed = applicationSchema.parse(input);
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("applications").insert(parsed).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data as Application;
}

export async function update(id: string, input: Partial<ApplicationInput>): Promise<Application> {
  const parsedId = idSchema.parse(id);
  const parsedInput = applicationSchema.partial().parse(input);
  const supabase = supabaseAdmin;
  const { data, error } = await supabase.from("applications").update(parsedInput).eq("id", parsedId).select().single();
  if (error) {
    throw new Error(error.message);
  }
  return data as Application;
}

export async function remove(id: string): Promise<void> {
  const parsed = idSchema.parse(id);
  const supabase = supabaseAdmin;
  const { error } = await supabase.from("applications").delete().eq("id", parsed);
  if (error) {
    throw new Error(error.message);
  }
}
