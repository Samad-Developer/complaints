import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/skeleton";
import { todayInPakistan } from "@/lib/format";
import { ComplaintForm } from "./complaint-form";

export const metadata: Metadata = { title: "New Complaint" };

export default function NewComplaintPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Register new complaint"
        description="A reference number is generated when the complaint is saved."
      />
      <Suspense fallback={<FormSkeleton />}>
        <FormWithDate />
      </Suspense>
    </div>
  );
}

async function FormWithDate() {
  await connection();
  return <ComplaintForm today={todayInPakistan()} />;
}

function FormSkeleton() {
  return (
    <div className="card space-y-7 p-5 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-16" />)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-44" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-32" />
    </div>
  );
}
