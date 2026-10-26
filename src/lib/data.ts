import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import {
  ATTACHMENTS_BUCKET,
  PAGE_SIZE,
  STATUSES,
  type ComplaintStatus,
} from "./constants";
import type { Complaint, ComplaintStats } from "./types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? "",
  };
}

export async function getStats(): Promise<ComplaintStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complaint_stats");
  if (error) throw new Error(`Could not load statistics: ${error.message}`);
  return data as ComplaintStats;
}

export async function getRecentComplaints(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("id, name, tehsil, department, status, complaint_date, complaint")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load complaints: ${error.message}`);
  return data as Pick<
    Complaint,
    "id" | "name" | "tehsil" | "department" | "status" | "complaint_date" | "complaint"
  >[];
}

export type ComplaintFilters = {
  q?: string;
  status?: string;
  tehsil?: string;
  department?: string;
  from?: string;
  to?: string;
  page?: number;
};

// Minimal shape of the PostgREST filter builder that applyFilters needs.
type Filterable = {
  eq(column: string, value: unknown): Filterable;
  gte(column: string, value: unknown): Filterable;
  lte(column: string, value: unknown): Filterable;
  or(filters: string): Filterable;
};

function applyFilters<Q>(builder: Q, filters: ComplaintFilters): Q {
  let query = builder as unknown as Filterable;
  if (filters.status && STATUSES.includes(filters.status as ComplaintStatus)) {
    query = query.eq("status", filters.status);
  }
  if (filters.tehsil) query = query.eq("tehsil", filters.tehsil);
  if (filters.department) query = query.eq("department", filters.department);
  if (filters.from) query = query.gte("complaint_date", filters.from);
  if (filters.to) query = query.lte("complaint_date", filters.to);

  const q = filters.q?.trim();
  if (q) {
    const refMatch = q.match(/^(?:dcc-?)?0*(\d+)$/i);
    // Strip characters that have meaning inside PostgREST `or` filters.
    const safe = q.replace(/[,()*%\\]/g, " ").trim();
    const parts = [
      `name.ilike.%${safe}%`,
      `contact_number.ilike.%${safe}%`,
      `complaint.ilike.%${safe}%`,
      `location.ilike.%${safe}%`,
    ];
    if (refMatch) parts.push(`id.eq.${refMatch[1]}`);
    query = query.or(parts.join(","));
  }

  return query as unknown as Q;
}

export async function listComplaints(filters: ComplaintFilters) {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const fromRow = (page - 1) * PAGE_SIZE;

  const query = applyFilters(
    supabase
      .from("complaints")
      .select(
        "id, name, tehsil, contact_number, complaint_date, complaint, location, department, status, attachments",
        { count: "exact" },
      ),
    filters,
  )
    .order("created_at", { ascending: false })
    .range(fromRow, fromRow + PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(`Could not load complaints: ${error.message}`);

  return {
    rows: (data ?? []) as Omit<Complaint, "remarks" | "created_by" | "created_at" | "updated_at">[],
    total: count ?? 0,
    page,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

/** Every complaint matching the filters, oldest first — used for Excel export. */
export async function exportComplaints(filters: ComplaintFilters) {
  const supabase = await createClient();
  const BATCH = 1000; // Supabase returns at most 1000 rows per request
  const rows: Complaint[] = [];

  for (let from = 0; ; from += BATCH) {
    const { data, error } = await applyFilters(
      supabase.from("complaints").select("*"),
      filters,
    )
      .order("id", { ascending: true })
      .range(from, from + BATCH - 1);
    if (error) throw new Error(`Could not export complaints: ${error.message}`);
    rows.push(...((data ?? []) as Complaint[]));
    if (!data || data.length < BATCH) break;
  }

  return rows;
}

export async function getComplaint(id: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load complaint: ${error.message}`);
  if (!data) return null;

  const complaint = data as Complaint;
  const paths = complaint.attachments.map((a) => a.path);

  let urls: Record<string, string> = {};
  if (paths.length) {

    const { data: signed } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrls(paths, 60 * 60);
      
    urls = Object.fromEntries(
      (signed ?? [])
        .filter((s) => s.signedUrl && s.path)
        .map((s) => [s.path as string, s.signedUrl as string]),
    );
  }

  return {
    ...complaint,
    attachments: complaint.attachments.map((a) => ({ ...a, url: urls[a.path] })),
  };
}
