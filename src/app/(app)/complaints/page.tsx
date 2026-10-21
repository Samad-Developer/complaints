import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, FilePlus2, Paperclip, SearchX } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { listComplaints } from "@/lib/data";
import { PAGE_SIZE, formatReference } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ComplaintFilters } from "./filters";
import { ExportButton } from "./export-button";

export const metadata: Metadata = { title: "All Complaints" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ComplaintsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="All complaints"
        description="Search, filter and open any complaint registered in the cell."
        actions={
          <>
          <Suspense fallback={null}>
            <ExportButton />
          </Suspense>
          <Link href="/complaints/new" className="btn-primary">
            <FilePlus2 className="size-4" aria-hidden />
            New complaint
          </Link>
          </>
        }
      />
      <Suspense fallback={<div className="card mb-4 h-[66px] sm:mb-5 md:h-[136px]" />}>
        <ComplaintFilters />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <ComplaintsTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function ComplaintsTable({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const filters = {
    q: one(sp.q),
    status: one(sp.status),
    tehsil: one(sp.tehsil),
    department: one(sp.department),
    from: one(sp.from),
    to: one(sp.to),
    page: Number(one(sp.page)) || 1,
  };
  const { rows, total, page, pageCount } = await listComplaints(filters);

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (k !== "page" && v) qs.set(k, String(v));
    }
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/complaints?${s}` : "/complaints";
  };

  if (rows.length === 0) {
    return (
      <div className="card px-6 py-16 text-center">
        <SearchX className="mx-auto size-9 text-ink-3" aria-hidden />
        <p className="mt-3 font-medium text-ink">No complaints found</p>
        <p className="mt-1 text-sm text-ink-2">Try a different search or clear the filters.</p>
      </div>
    );
  }

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = start + rows.length - 1;

  return (
    <div className="card overflow-hidden">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th className="px-5 py-3 font-medium">Ref no.</th>
              <th className="px-5 py-3 font-medium">Complainant</th>
              <th className="px-5 py-3 font-medium">Complaint</th>
              <th className="px-5 py-3 font-medium">Tehsil</th>
              <th className="px-5 py-3 font-medium">Department</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id} className="group relative transition hover:bg-canvas/60">
                <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-ink-3">
                  <Link href={`/complaints/${c.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                    {formatReference(c.id)}
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-ink-3">{c.contact_number}</p>
                </td>
                <td className="max-w-xs px-5 py-3.5">
                  <p className="truncate text-ink-2">{c.complaint}</p>
                  <p className="flex items-center gap-2 truncate text-xs text-ink-3">
                    {c.location}
                    {c.attachments?.length > 0 && (
                      <span className="inline-flex items-center gap-0.5" title={`${c.attachments.length} attachment(s)`}>
                        <Paperclip className="size-3" aria-hidden />
                        {c.attachments.length}
                      </span>
                    )}
                  </p>
                </td>
                <td className="px-5 py-3.5 text-ink-2">{c.tehsil}</td>
                <td className="whitespace-nowrap px-5 py-3.5 text-ink-2">{c.department}</td>
                <td className="whitespace-nowrap px-5 py-3.5 text-ink-2">{formatDate(c.complaint_date)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/complaints/${c.id}`} className="block px-4 py-4 hover:bg-canvas/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-ink-3">{formatReference(c.id)}</p>
                  <p className="mt-0.5 font-medium text-ink">{c.name}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ink-2">{c.complaint}</p>
              <p className="mt-2 text-xs text-ink-3">
                {c.tehsil} · {c.department} · {formatDate(c.complaint_date)}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
        <p className="text-ink-2">
          Showing <span className="font-medium text-ink">{start}–{end}</span> of{" "}
          <span className="font-medium text-ink">{total.toLocaleString()}</span>
        </p>
        <div className="flex items-center gap-2">
          <PagerLink href={pageHref(page - 1)} disabled={page <= 1} label="Previous">
            <ChevronLeft className="size-4" aria-hidden />
          </PagerLink>
          <span className="px-1 tabular-nums text-ink-2">
            Page {page} of {pageCount}
          </span>
          <PagerLink href={pageHref(page + 1)} disabled={page >= pageCount} label="Next">
            <ChevronRight className="size-4" aria-hidden />
          </PagerLink>
        </div>
      </div>
    </div>
  );
}

function PagerLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const cls = "grid size-9 place-items-center rounded-lg border border-line bg-white";
  if (disabled) {
    return (
      <span className={`${cls} opacity-40`} aria-disabled>
        {children}
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <Link href={href} className={`${cls} hover:bg-canvas`}>
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

function TableSkeleton() {
  return (
    <div className="card p-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
