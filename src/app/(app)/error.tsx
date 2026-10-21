"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card mx-auto max-w-lg px-6 py-14 text-center">
      <CircleAlert className="mx-auto size-9 text-red-600" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold text-ink">Something went wrong</h1>
      <p className="mt-1 text-sm text-ink-2">{error.message || "An unexpected error occurred."}</p>
      <button onClick={reset} className="btn-primary mt-5">
        <RotateCcw className="size-4" aria-hidden />
        Try again
      </button>
    </div>
  );
}
