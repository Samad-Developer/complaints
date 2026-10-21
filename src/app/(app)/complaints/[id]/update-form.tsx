"use client";

import { useActionState } from "react";
import { CircleAlert, CircleCheck, LoaderCircle, Save } from "lucide-react";
import { updateComplaint } from "@/app/actions";
import { Field } from "@/components/field";
import { DEPARTMENTS, STATUSES, STATUS_LABELS, type ComplaintStatus } from "@/lib/constants";

export function UpdateForm({
  id,
  status,
  department,
  remarks,
}: {
  id: number;
  status: ComplaintStatus;
  department: string;
  remarks: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateComplaint, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Status" htmlFor="status">
        <select id="status" name="status" defaultValue={status} className="control">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </Field>
      <Field label="Concerned department" htmlFor="department">
        <select id="department" name="department" defaultValue={department} className="control">
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>
      <Field label="Remarks" htmlFor="remarks">
        <textarea
          id="remarks"
          name="remarks"
          rows={4}
          defaultValue={remarks ?? ""}
          className="control resize-y"
          placeholder="Progress notes, action taken…"
        />
      </Field>

      {state?.message && (
        <p
          role="status"
          className={
            state.ok
              ? "flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
              : "flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
          }
        >
          {state.ok ? <CircleCheck className="size-4" aria-hidden /> : <CircleAlert className="size-4" aria-hidden />}
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
