"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  FileText,
  ImageIcon,
  LoaderCircle,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { createComplaint } from "@/app/actions";
import { Field } from "@/components/field";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_FILE_TYPES,
  ATTACHMENTS_BUCKET,
  DEPARTMENTS,
  MAX_FILES,
  MAX_FILE_SIZE,
  STATUS_LABELS,
  TEHSILS,
  type ComplaintStatus,
} from "@/lib/constants";
import { formatBytes } from "@/lib/format";
import type { ActionState, Attachment } from "@/lib/types";
import { parseComplaint } from "@/lib/validation";

const STATUS_OPTIONS: { value: ComplaintStatus; Icon: typeof Clock3; color: string }[] = [
  { value: "pending", Icon: Clock3, color: "text-amber-600" },
  { value: "in_process", Icon: LoaderCircle, color: "text-blue-600" },
  { value: "complete", Icon: CircleCheck, color: "text-green-600" },
];

export function ComplaintForm({ today }: { today: string }) {
  const [state, setState] = useState<ActionState>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const errors = state?.fieldErrors ?? {};

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFileError(null);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!ALLOWED_FILE_TYPES.includes(f.type)) {
        setFileError(`"${f.name}" is not allowed. Use PNG, JPG, JPEG or PDF.`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`"${f.name}" is larger than 5 MB.`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        setFileError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("files");

    // Validate before uploading anything; the server re-validates with the same schema.
    const { errors: clientErrors } = parseComplaint(fd);
    if (clientErrors) {
      setState({ ok: false, message: "Please fix the highlighted fields.", fieldErrors: clientErrors });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    startTransition(async () => {
      const uploaded: Attachment[] = [];
      if (files.length) {
        setPhase("uploading");
        const supabase = createClient();

        for (const file of files) {
          const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-100);
          const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;

          const { error } = await supabase.storage
            .from(ATTACHMENTS_BUCKET)
            .upload(path, file, { contentType: file.type, upsert: false });

          if (error) {
            if (uploaded.length) {
              await supabase.storage.from(ATTACHMENTS_BUCKET).remove(uploaded.map((a) => a.path));
            }
            startTransition(() => {
              setPhase("idle");
              setState({ ok: false, message: `Upload failed for "${file.name}": ${error.message}` });
            });
            return;
          }

          uploaded.push({ path, name: file.name, type: file.type, size: file.size });
        }
      }

      setPhase("saving");
      fd.set("attachments", JSON.stringify(uploaded));
      const result = await createComplaint(null, fd);
      
      // Only reached when saving failed — success redirects to the complaint.
      if (!result || result.ok) return;
      if (uploaded.length) {
        await createClient().storage.from(ATTACHMENTS_BUCKET).remove(uploaded.map((a) => a.path));
      }
      startTransition(() => {
        setPhase("idle");
        setState(result);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const invalid = (name: string) =>
    errors[name] ? { "aria-invalid": true as const, "aria-describedby": `${name}-error` } : {};

  return (
    <form onSubmit={onSubmit} noValidate className="card overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-700 via-brand-500 to-brand-700" aria-hidden />

      <div className="space-y-6 p-4 sm:space-y-7 sm:p-8">
        {state && !state.ok && state.message && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {state.message}
          </div>
        )}

        {/* Complainant */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name" htmlFor="name" error={errors.name}>
            <input id="name" name="name" className="control" placeholder="Full name" autoComplete="off" {...invalid("name")} />
          </Field>
          <Field label="Tehsil" htmlFor="tehsil" error={errors.tehsil}>
            <select id="tehsil" name="tehsil" className="control" defaultValue="" {...invalid("tehsil")}>
              <option value="">Select tehsil</option>
              {TEHSILS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Contact number" htmlFor="contact_number" error={errors.contact_number}>
            <input id="contact_number" name="contact_number" type="tel" inputMode="tel" className="control" placeholder="03XXXXXXXXX" maxLength={15} {...invalid("contact_number")} />
          </Field>
          <Field label="Date" htmlFor="complaint_date" error={errors.complaint_date}>
            <input id="complaint_date" name="complaint_date" type="date" className="control" defaultValue={today} max={today} {...invalid("complaint_date")} />
          </Field>
        </div>

        <Divider />

        {/* Complaint */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Field label="Complaint" htmlFor="complaint" error={errors.complaint} className="lg:row-span-2">
            <textarea id="complaint" name="complaint" rows={7} className="control h-full min-h-40 resize-y" placeholder="Describe the complaint in detail…" {...invalid("complaint")} />
          </Field>
          <Field label="Complaint location" htmlFor="location" error={errors.location}>
            <input id="location" name="location" className="control" placeholder="Village / mohalla / landmark" {...invalid("location")} />
          </Field>
          <Field label="Remarks" htmlFor="remarks" error={errors.remarks}>
            <textarea id="remarks" name="remarks" rows={3} className="control resize-y" placeholder="Any additional remarks (optional)" />
          </Field>
        </div>

        <Divider />

        {/* Department + status */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Field label="Concerned department" htmlFor="department" error={errors.department}>
            <select id="department" name="department" className="control" defaultValue="" {...invalid("department")}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <fieldset className="lg:col-span-2">
            <legend className="field-label">Status</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-canvas p-1 ring-1 ring-line sm:gap-2">
              {STATUS_OPTIONS.map(({ value, Icon, color }) => (
                <label
                  key={value}
                  className="flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-xs font-medium sm:flex-row sm:gap-2 sm:px-2 sm:text-sm text-ink-2 transition hover:text-ink has-checked:bg-white has-checked:text-ink has-checked:shadow-sm has-checked:ring-1 has-checked:ring-line has-focus-visible:ring-2 has-focus-visible:ring-brand-500/40"
                >
                  <input type="radio" name="status" value={value} defaultChecked={value === "pending"} className="sr-only" />
                  <Icon className={clsx("size-4 shrink-0", color)} aria-hidden />
                  <span className="truncate">{STATUS_LABELS[value]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Attachments */}
        <div>
          <p className="field-label">Attachments</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={clsx(
              "rounded-xl border-2 border-dashed p-4 transition",
              dragging ? "border-brand-500 bg-brand-50" : "border-line bg-canvas/40",
            )}
          >
            {files.length < MAX_FILES && (
              <button
                type="button"
                disabled={pending}
                onClick={() => inputRef.current?.click()}
                className="flex w-full flex-col items-center gap-1.5 rounded-lg py-4 text-center transition hover:bg-white/70"
              >
                <span className="grid size-10 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-line">
                  <UploadCloud className="size-5" aria-hidden />
                </span>
                <span className="text-sm text-ink-2">
                  <span className="font-medium text-brand-700">Click to upload</span> or drag and drop
                </span>
                <span className="text-xs text-ink-3">
                  PNG, JPG, JPEG or PDF · up to 5 MB each · max {MAX_FILES} files
                </span>
              </button>
            )}

            {files.length > 0 && (
              <ul className={clsx("grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3", files.length < MAX_FILES && "mt-3")}>
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="relative flex items-center gap-3 rounded-lg bg-white p-2.5 pr-10 ring-1 ring-line">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-canvas">
                      {f.type === "application/pdf" ? (
                        <FileText className="size-[18px] text-red-600" aria-hidden />
                      ) : (
                        <ImageIcon className="size-[18px] text-brand-600" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink" title={f.name}>{f.name}</p>
                      <p className="text-xs text-ink-3">{formatBytes(f.size)}</p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-ink-3 hover:bg-canvas hover:text-ink"
                    >
                      <X className="size-4" aria-hidden />
                      <span className="sr-only">Remove {f.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={inputRef}
              type="file"
              name="files"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          {fileError && <p className="mt-2 text-xs text-red-600">{fileError}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-3 border-t border-line bg-canvas/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
        <div className="flex gap-3">
          <Link href="/complaints" className="btn-secondary flex-1 sm:flex-none">Cancel</Link>
          <button type="submit" disabled={pending} className="btn-primary flex-1 sm:min-w-48 sm:flex-none">
            {pending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                {phase === "uploading" ? "Uploading files…" : "Saving…"}
              </>
            ) : (
              <>
                <Send className="size-4" aria-hidden />
                Register complaint
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function Divider() {
  return <div className="h-px bg-line" aria-hidden />;
}
