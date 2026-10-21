import Link from "next/link";
import { SearchX } from "lucide-react";

export default function ComplaintNotFound() {
  return (
    <div className="card mx-auto max-w-lg px-6 py-16 text-center">
      <SearchX className="mx-auto size-9 text-ink-3" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold text-ink">Complaint not found</h1>
      <p className="mt-1 text-sm text-ink-2">It may have been deleted, or the reference is incorrect.</p>
      <Link href="/complaints" className="btn-primary mt-5">Back to all complaints</Link>
    </div>
  );
}
