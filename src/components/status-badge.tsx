import { CircleCheck, Clock3, LoaderCircle } from "lucide-react";
import clsx from "clsx";
import { STATUS_LABELS, type ComplaintStatus } from "@/lib/constants";

const STYLES: Record<ComplaintStatus, { cls: string; Icon: typeof Clock3 }> = {
  pending: { cls: "bg-amber-50 text-amber-800 ring-amber-200", Icon: Clock3 },
  in_process: { cls: "bg-blue-50 text-blue-800 ring-blue-200", Icon: LoaderCircle },
  complete: { cls: "bg-green-50 text-green-800 ring-green-200", Icon: CircleCheck },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  const { cls, Icon } = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        cls,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
