"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteComplaint } from "@/app/actions";

export function DeleteButton({ id }: { id: number }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="btn-danger" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" aria-hidden />
        Delete
      </button>
    );
  }

  return (
    <form action={deleteComplaint} className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2 pl-3 sm:w-auto sm:py-1 sm:pr-1">
      <input type="hidden" name="id" value={id} />
      <span className="flex-1 text-sm text-red-800 sm:flex-none">Delete permanently?</span>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-md px-2.5 py-1.5 text-sm text-ink-2 hover:bg-white" onClick={() => setConfirming(false)}>
          Cancel
        </button>
        <ConfirmButton />
      </div>
    </form>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
    >
      {pending && <LoaderCircle className="size-3.5 animate-spin" aria-hidden />}
      Delete
    </button>
  );
}
