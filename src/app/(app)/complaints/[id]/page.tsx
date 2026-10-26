import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleCheck,
  Download,
  FileText,
  MapPin,
  Paperclip,
  Phone,
  User,
} from "lucide-react";
import { Skeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { getComplaint } from "@/lib/data";
import { formatReference } from "@/lib/constants";
import { formatBytes, formatDate, formatDateTime } from "@/lib/format";
import { UpdateForm } from "./update-form";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "Complaint" };

export default function ComplaintDetailPage(props: PageProps<"/complaints/[id]">) {
  return (
    <>
      <Link href="/complaints" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        All complaints
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ComplaintDetail {...props} />
      </Suspense>
    </>
  );
}

async function ComplaintDetail({ params, searchParams }: PageProps<"/complaints/[id]">) {
  const [{ id: rawId }, sp] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();

  const c = await getComplaint(id);
  if (!c) notFound();

  const justCreated = sp.created === "1";

  return (
    <div>
      {justCreated && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Complaint registered successfully. Reference number{" "}
            <strong className="font-mono">{formatReference(c.id)}</strong> — share it with the complainant for follow-up.
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-ink">{formatReference(c.id)}</h1>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-1 text-sm text-ink-2">
            Registered {formatDateTime(c.created_at)}
            {c.updated_at !== c.created_at && <> · Last updated {formatDateTime(c.updated_at)}</>}
          </p>
        </div>
        <DeleteButton id={c.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-ink">Complainant</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info Icon={User} label="Name" value={c.name ?? "—"} />
              <Info Icon={Phone} label="Contact number" value={c.contact_number ? <a href={`tel:${c.contact_number}`} className="hover:text-brand-700">{c.contact_number}</a> : "—"} />
              <Info Icon={Building2} label="Tehsil" value={c.tehsil ?? "—"} />
              <Info Icon={CalendarDays} label="Complaint date" value={formatDate(c.complaint_date)} />
            </dl>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold text-ink">Complaint</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{c.complaint ?? "—"}</p>
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-canvas px-3 py-2.5 text-sm text-ink-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
              <span><span className="text-ink-3">Location:</span> {c.location ?? "—"}</span>
            </div>
            {c.remarks && (
              <div className="mt-5 border-t border-line pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Remarks</h3>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-2">{c.remarks}</p>
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink">
              <Paperclip className="size-4 text-ink-3" aria-hidden />
              Attachments
              <span className="text-sm font-normal text-ink-3">({c.attachments.length})</span>
            </h2>
            {c.attachments.length === 0 ? (
              <p className="text-sm text-ink-3">No files were attached to this complaint.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {c.attachments.map((a) => (
                  <li key={a.path} className="overflow-hidden rounded-xl border border-line">
                    {a.type.startsWith("image/") && a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer" className="block bg-canvas">
                        {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL */}
                        <img src={a.url} alt={a.name} className="h-44 w-full object-cover" />
                      </a>
                    ) : (
                      <div className="grid h-44 place-items-center bg-canvas">
                        <FileText className="size-10 text-red-600/80" aria-hidden />
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink" title={a.name}>{a.name}</p>
                        <p className="text-xs text-ink-3">{formatBytes(a.size)}</p>
                      </div>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-lg text-ink-2 hover:bg-canvas hover:text-ink" title="Open">
                          <Download className="size-4" aria-hidden />
                          <span className="sr-only">Open {a.name}</span>
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold text-ink">Update complaint</h2>
            <p className="mb-5 text-xs text-ink-3">Change status, reassign, or add remarks.</p>
            <UpdateForm id={c.id} status={c.status} department={c.department} remarks={c.remarks} />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({
  Icon,
  label,
  value,
}: {
  Icon: typeof User;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas text-ink-3">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-3">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6"><Skeleton className="h-28 w-full" /></div>
          <div className="card p-6"><Skeleton className="h-40 w-full" /></div>
        </div>
        <div className="card p-6"><Skeleton className="h-64 w-full" /></div>
      </div>
    </div>
  );
}
