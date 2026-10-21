"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { DEPARTMENTS, STATUSES, STATUS_LABELS, TEHSILS } from "@/lib/constants";

const FILTER_KEYS = ["status", "tehsil", "department", "from", "to"] as const;

export function ComplaintFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Debounce the free-text search.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const t = setTimeout(() => update({ q: q.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeCount = FILTER_KEYS.filter((k) => params.get(k)).length;
  const hasFilters = activeCount > 0 || Boolean(params.get("q"));

  return (
    <div className="card mb-4 p-3 sm:mb-5 sm:p-4">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="q" className="sr-only">Search</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, phone, location, ref no…"
            className="control pl-9 pr-9"
          />
          {pending && (
            <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-3" aria-hidden />
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="complaint-filters"
          className={clsx("btn-secondary relative shrink-0 px-3 md:hidden", open && "border-brand-500 bg-brand-50 text-brand-800")}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Filters</span>
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand-700 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="btn-secondary shrink-0 px-3"
            title="Clear all filters"
          >
            <X className="size-4" aria-hidden />
            <span className="sr-only lg:not-sr-only">Clear</span>
          </button>
        )}
      </div>

      <div
        id="complaint-filters"
        className={clsx(
          "mt-3 grid-cols-2 gap-3 md:grid md:grid-cols-3 xl:grid-cols-5",
          open ? "grid" : "hidden",
        )}
      >
        <FilterSelect id="f-status" label="Status" value={params.get("status")} onChange={(v) => update({ status: v })} allLabel="All statuses">
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </FilterSelect>
        <FilterSelect id="f-tehsil" label="Tehsil" value={params.get("tehsil")} onChange={(v) => update({ tehsil: v })} allLabel="All tehsils">
          {TEHSILS.map((t) => <option key={t} value={t}>{t}</option>)}
        </FilterSelect>
        <FilterSelect
          id="f-department"
          label="Department"
          value={params.get("department")}
          onChange={(v) => update({ department: v })}
          allLabel="All departments"
          className="col-span-2 md:col-span-1"
        >
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </FilterSelect>
        <div className="min-w-0">
          <label htmlFor="from" className="mb-1 block text-xs text-ink-3">From date</label>
          <input id="from" type="date" className="control" value={params.get("from") ?? ""} onChange={(e) => update({ from: e.target.value })} />
        </div>
        <div className="min-w-0">
          <label htmlFor="to" className="mb-1 block text-xs text-ink-3">To date</label>
          <input id="to" type="date" className="control" value={params.get("to") ?? ""} onChange={(e) => update({ to: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  allLabel,
  className,
  children,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string) => void;
  allLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("min-w-0", className)}>
      <label className="mb-1 block text-xs text-ink-3" htmlFor={id}>{label}</label>
      <select id={id} className="control" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {children}
      </select>
    </div>
  );
}
