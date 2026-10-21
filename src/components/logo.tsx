import { Landmark } from "lucide-react";

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={
          light
            ? "grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15"
            : "grid size-10 place-items-center rounded-xl bg-brand-700 text-white"
        }
      >
        <Landmark className={light ? "size-5 text-white" : "size-5"} aria-hidden />
      </div>
      <div className="leading-tight">
        <p className={light ? "text-[15px] font-semibold text-white" : "text-[15px] font-semibold text-ink"}>
          DC Complaint Cell
        </p>
        <p className={light ? "text-xs text-brand-100/60" : "text-xs text-ink-3"}>
          Deputy Commissioner, Swabi
        </p>
      </div>
    </div>
  );
}
