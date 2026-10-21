"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ATTACHMENTS_BUCKET,
  DEPARTMENTS,
  MAX_FILES,
  STATUSES,
  TEHSILS,
  type ComplaintStatus,
} from "@/lib/constants";
import type { ActionState, Attachment } from "@/lib/types";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

// ---------- Auth ----------

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");
  const next = text(formData, "next");

  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: "Invalid email or password." };
  }

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Complaints ----------

function validateComplaint(formData: FormData) {
  const values = {
    name: text(formData, "name"),
    tehsil: text(formData, "tehsil"),
    contact_number: text(formData, "contact_number"),
    complaint_date: text(formData, "complaint_date"),
    complaint: text(formData, "complaint"),
    location: text(formData, "location"),
    remarks: text(formData, "remarks"),
    department: text(formData, "department"),
    status: text(formData, "status") || "pending",
  };

  const errors: Record<string, string> = {};
  if (values.name.length < 2) errors.name = "Enter the complainant's name.";
  if (!TEHSILS.includes(values.tehsil as (typeof TEHSILS)[number]))
    errors.tehsil = "Select a tehsil.";
  const digits = values.contact_number.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 13 || /[^\d\s+\-]/.test(values.contact_number))
    errors.contact_number = "Enter a valid contact number, e.g. 0300-1234567.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.complaint_date))
    errors.complaint_date = "Select a date.";
  if (values.complaint.length < 5) errors.complaint = "Describe the complaint (at least 5 characters).";
  if (values.location.length < 2) errors.location = "Enter where the issue is.";
  if (!DEPARTMENTS.includes(values.department as (typeof DEPARTMENTS)[number]))
    errors.department = "Select the concerned department.";
  if (!STATUSES.includes(values.status as ComplaintStatus)) errors.status = "Select a status.";

  return { values, errors };
}

function parseAttachments(formData: FormData): Attachment[] {
  try {
    const raw = JSON.parse(String(formData.get("attachments") ?? "[]"));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(
        (a): a is Attachment =>
          a && typeof a.path === "string" && typeof a.name === "string",
      )
      .slice(0, MAX_FILES)
      .map((a) => ({
        path: a.path,
        name: a.name.slice(0, 200),
        type: String(a.type ?? ""),
        size: Number(a.size) || 0,
      }));
  } catch {
    return [];
  }
}

export async function createComplaint(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { values, errors } = validateComplaint(formData);
  if (Object.keys(errors).length) {
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: errors };
  }

  const attachments = parseAttachments(formData);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("complaints")
    .insert({ ...values, remarks: values.remarks || null, attachments })
    .select("id")
    .single();

  if (error) {
    // Clean up files that were uploaded for a complaint that failed to save.
    if (attachments.length) {
      await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .remove(attachments.map((a) => a.path));
    }
    return { ok: false, message: `Could not save complaint: ${error.message}` };
  }

  redirect(`/complaints/${data.id}?created=1`);
}

export async function updateComplaint(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = Number(formData.get("id"));
  const status = text(formData, "status");
  const department = text(formData, "department");
  const remarks = text(formData, "remarks");

  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "Invalid complaint." };
  if (!STATUSES.includes(status as ComplaintStatus))
    return { ok: false, message: "Select a valid status." };
  if (!DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number]))
    return { ok: false, message: "Select a valid department." };
  if (remarks.length > 2000) return { ok: false, message: "Remarks are too long." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("complaints")
    .update({ status, department, remarks: remarks || null })
    .eq("id", id);

  if (error) return { ok: false, message: `Could not update: ${error.message}` };

  refresh();
  return { ok: true, message: "Complaint updated." };
}

export async function deleteComplaint(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select("attachments")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("complaints").delete().eq("id", id);
  if (error) throw new Error(`Could not delete complaint: ${error.message}`);

  const paths = ((data?.attachments ?? []) as Attachment[]).map((a) => a.path);
  if (paths.length) await supabase.storage.from(ATTACHMENTS_BUCKET).remove(paths);

  redirect("/complaints");
}
