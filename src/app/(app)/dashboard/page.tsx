import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  FilePlus2,
  Inbox,
  LoaderCircle,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { BarList, DailyColumns, StatusSplit } from "@/components/charts";
import { getRecentComplaints, getStats } from "@/lib/data";
import { DEPARTMENTS, TEHSILS, formatReference } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of complaints received by the Deputy Commissioner Complaint Cell."
        actions={
          <Link href="/complaints/new" className="btn-primary">
            <FilePlus2 className="size-4" aria-hidden />
            New complaint
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const [stats, recent] = await Promise.all([getStats(), getRecentComplaints(6)]);
  const s = stats.by_status ?? {};
  const total = stats.total ?? 0;
  const pct = (n = 0) => (total ? `${Math.round((n / total) * 100)}% of total` : "—");

  const tiles = [
    { label: "Total complaints", value: total, hint: "All time", Icon: Inbox, href: "/complaints", tone: "bg-brand-50 text-brand-700" },
    { label: "Pending", value: s.pending ?? 0, hint: pct(s.pending), Icon: Clock3, href: "/complaints?status=pending", tone: "bg-amber-50 text-amber-700" },
    { label: "In process", value: s.in_process ?? 0, hint: pct(s.in_process), Icon: LoaderCircle, href: "/complaints?status=in_process", tone: "bg-blue-50 text-blue-700" },
    { label: "Complete", value: s.complete ?? 0, hint: pct(s.complete), Icon: CircleCheck, href: "/complaints?status=complete", tone: "bg-green-50 text-green-700" },
  ];

  const tehsilData = TEHSILS.map((t) => ({ label: t, value: stats.by_tehsil?.[t] ?? 0 }));
  const deptData = DEPARTMENTS.map((d) => ({ label: d, value: stats.by_department?.[d] ?? 0 }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {tiles.map(({ label, value, hint, Icon, href, tone }) => (
          <Link
            key={label}
            href={href}
            className="card group min-w-0 p-4 transition hover:border-brand-200 hover:shadow-md sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-ink-2 sm:text-sm">{label}</p>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg sm:size-9 ${tone}`}>
                <Icon className="size-4 sm:size-[18px]" aria-hidden />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink sm:mt-3 sm:text-3xl">
              {value.toLocaleString()}
            </p>
            <p className="mt-1 truncate text-xs text-ink-3">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <section className="card p-4 sm:p-5 xl:col-span-2">
          <SectionTitle title="Complaints received" subtitle="Last 30 days, by complaint date" />
          <DailyColumns daily={stats.daily ?? []} />
        </section>
        <section className="card p-4 sm:p-5">
          <SectionTitle title="Resolution status" subtitle={`${total.toLocaleString()} complaints`} />
          <StatusSplit counts={s} total={total} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        <section className="card p-4 sm:p-5">
          <SectionTitle title="By tehsil" subtitle="Complaints per tehsil" />
          <BarList data={tehsilData} />
        </section>
        <section className="card p-4 sm:p-5 xl:col-span-2">
          <SectionTitle title="By concerned department" subtitle="Departments with assigned complaints" />
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <BarList data={deptData.slice(0, Math.ceil(deptData.length / 2))} />
            <div className="mt-3 md:mt-0">
              {deptData.length > 1 && (
                <BarList data={deptData.slice(Math.ceil(deptData.length / 2))} emptyLabel="" />
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold text-ink">Recent complaints</h2>
            <p className="text-xs text-ink-3">Latest entries registered in the cell</p>
          </div>
          <Link href="/complaints" className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
            View all <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Inbox className="mx-auto size-8 text-ink-3" aria-hidden />
            <p className="mt-2 text-sm text-ink-2">No complaints registered yet.</p>
            <Link href="/complaints/new" className="btn-primary mt-4">
              Register the first complaint
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/complaints/${c.id}`}
                  className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-canvas/60 sm:items-center sm:gap-4 sm:px-5"
                >
                  <span className="hidden w-24 shrink-0 font-mono text-xs text-ink-3 sm:block">{formatReference(c.id)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-ink-3 sm:hidden">{formatReference(c.id)}</p>
                    <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                    <p className="truncate text-xs text-ink-3">{c.complaint}</p>
                    <p className="mt-1 truncate text-xs text-ink-2 sm:hidden">
                      {c.tehsil} · {c.department} · {formatDate(c.complaint_date)}
                    </p>
                  </div>
                  <span className="hidden w-28 shrink-0 text-xs text-ink-2 md:block">{c.department}</span>
                  <span className="hidden w-16 shrink-0 text-xs text-ink-2 sm:block">{c.tehsil}</span>
                  <span className="hidden w-24 shrink-0 text-xs text-ink-3 sm:block">{formatDate(c.complaint_date)}</span>
                  <StatusBadge status={c.status} className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-xs text-ink-3">{subtitle}</p>}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 sm:p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2"><Skeleton className="h-56 w-full" /></div>
        <div className="card p-5"><Skeleton className="h-56 w-full" /></div>
      </div>
      <div className="card p-5"><Skeleton className="h-64 w-full" /></div>
    </div>
  );
}
