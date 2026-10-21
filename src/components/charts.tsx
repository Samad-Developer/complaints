import { CircleCheck, Clock3, LoaderCircle } from "lucide-react";
import { STATUSES, STATUS_LABELS, type ComplaintStatus } from "@/lib/constants";
import { todayInPakistan } from "@/lib/format";

const STATUS_COLOR: Record<ComplaintStatus, string> = {
  pending: "var(--color-st-pending)",
  in_process: "var(--color-st-progress)",
  complete: "var(--color-st-complete)",
};
const STATUS_ICON = { pending: Clock3, in_process: LoaderCircle, complete: CircleCheck };

/** One stacked bar showing the share of each status, with an icon+label legend. */
export function StatusSplit({
  counts,
  total,
}: {
  counts: Partial<Record<ComplaintStatus, number>>;
  total: number;
}) {
  const resolved = total ? Math.round(((counts.complete ?? 0) / total) * 100) : 0;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink">{resolved}%</span>
        <span className="text-sm text-ink-2">resolved</span>
      </div>

      <div
        className="flex h-3 w-full gap-[2px] rounded-full bg-canvas"
        role="img"
        aria-label={STATUSES.map((s) => `${STATUS_LABELS[s]}: ${counts[s] ?? 0}`).join(", ")}
      >
        {total > 0 &&
          STATUSES.filter((s) => (counts[s] ?? 0) > 0).map((s) => {
            const n = counts[s] ?? 0;
            return (
              <div
                key={s}
                className="group relative h-full min-w-1.5 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(n / total) * 100}%`, background: STATUS_COLOR[s] }}
              >
                <Tooltip>
                  {STATUS_LABELS[s]}: <strong>{n}</strong> ({Math.round((n / total) * 100)}%)
                </Tooltip>
              </div>
            );
          })}
      </div>

      <ul className="mt-5 divide-y divide-line">
        {STATUSES.map((s) => {
          const Icon = STATUS_ICON[s];
          const n = counts[s] ?? 0;
          return (
            <li key={s} className="flex items-center gap-2.5 py-2.5 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: STATUS_COLOR[s] }} />
              <Icon className="size-4 shrink-0 text-ink-3" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-ink-2">{STATUS_LABELS[s]}</span>
              <span className="font-medium tabular-nums text-ink">{n.toLocaleString()}</span>
              <span className="w-11 text-right tabular-nums text-ink-3">
                {total ? Math.round((n / total) * 100) : 0}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Horizontal bars for a single series — every row direct-labeled. */
export function BarList({
  data,
  emptyLabel = "No complaints yet",
}: {
  data: { label: string; value: number }[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (!total) return <p className="py-6 text-center text-sm text-ink-3">{emptyLabel}</p>;

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="group relative">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-2">{d.label}</span>
            <span className="font-medium tabular-nums text-ink">{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] group-hover:bg-brand-700"
              style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value ? 6 : 0 }}
            />
          </div>
          <Tooltip>
            {d.label}: <strong>{d.value}</strong> ({Math.round((d.value / total) * 100)}% of total)
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}

/** Daily complaint volume for the last 30 days. */
export function DailyColumns({ daily }: { daily: { day: string; count: number }[] }) {
  const byDay = new Map(daily.map((d) => [d.day, d.count]));
  const days: { day: string; count: number; date: Date }[] = [];
  // "Today" in Pakistan time, regardless of the server's timezone.
  const [y, m, dd] = todayInPakistan().split("-").map(Number);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1, dd - i));
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, count: byDay.get(key) ?? 0, date: d });
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const gridTop = niceCeil(max);

  return (
    <div>
      <div className="relative h-44">
        {/* recessive gridlines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[gridTop, Math.round(gridTop / 2), 0].map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-right text-[11px] tabular-nums text-ink-3">{v}</span>
              <div className="h-px flex-1 bg-line/70" />
            </div>
          ))}
        </div>
        <div className="absolute inset-y-[7px] left-8 right-0 flex items-end gap-[2px]">
          {days.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] bg-brand-600 transition-colors group-hover:bg-brand-800"
                style={{ height: `${(d.count / gridTop) * 100}%`, minHeight: d.count ? 3 : 0 }}
              />
              <Tooltip>
                {fmt(d.date)}: <strong>{d.count}</strong> complaint{d.count === 1 ? "" : "s"}
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-8 text-[11px] text-ink-3">
        <span>{fmt(days[0].date)}</span>
        <span>{fmt(days[14].date)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function niceCeil(n: number) {
  if (n <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(n)));
  return Math.ceil(n / (step / 2)) * (step / 2);
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
    >
      {children}
    </span>
  );
}
