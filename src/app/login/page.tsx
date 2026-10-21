import { Suspense } from "react";
import type { Metadata } from "next";
import { ClipboardList, ShieldCheck, Timer } from "lucide-react";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-950 p-12 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div aria-hidden className="absolute -bottom-40 -right-40 size-[520px] rounded-full bg-brand-700/40 blur-3xl" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            Every complaint registered, assigned and resolved.
          </h1>
          <p className="mt-4 text-brand-100/70">
            The Deputy Commissioner Complaint Cell records public complaints across Topi, Swabi,
            Lahor and Razzar tehsils and tracks them until resolution.
          </p>
          <ul className="mt-10 space-y-4 text-sm text-brand-100/80">
            <li className="flex items-center gap-3"><ClipboardList className="size-4" aria-hidden /> Register complaints with supporting documents</li>
            <li className="flex items-center gap-3"><Timer className="size-4" aria-hidden /> Track pending, in-process and completed cases</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-4" aria-hidden /> Restricted to authorised complaint-cell staff</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo light={false} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">Staff sign in</h2>
          <p className="mb-8 mt-1 text-sm text-ink-2">Use the account issued by the complaint cell administrator.</p>
          <Suspense fallback={<div className="h-[260px]" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
