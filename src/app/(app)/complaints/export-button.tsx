"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, LoaderCircle } from "lucide-react";

const FILTER_KEYS = ["q", "status", "tehsil", "department", "from", "to"];

export function ExportButton() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const qs = new URLSearchParams();
  for (const k of FILTER_KEYS) {
    const v = params.get(k);
    if (v) qs.set(k, v);
  }
  const filtered = qs.size > 0;

  async function onExport() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/complaints/export?${qs.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Export failed");
      }
      const blob = await res.blob();
      const name =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
        "complaints.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onExport}
        disabled={busy}
        className="btn-secondary w-full whitespace-nowrap"
        title={filtered ? "Export complaints matching the current filters" : "Export all complaints"}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <FileSpreadsheet className="size-4 text-green-700" aria-hidden />
        )}
        {busy ? "Exporting…" : (
          <>
            <span className="sm:hidden">{filtered ? "Export filtered" : "Export Excel"}</span>
            <span className="hidden sm:inline">{filtered ? "Export filtered to Excel" : "Export to Excel"}</span>
          </>
        )}
      </button>
      {error && (
        <p role="alert" className="absolute left-0 top-full mt-1 text-xs text-red-600 sm:left-auto sm:right-0 sm:whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
