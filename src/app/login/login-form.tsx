"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, LoaderCircle, LogIn } from "lucide-react";
import { signIn } from "@/app/actions";
import { Field } from "@/components/field";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, null);
  const next = useSearchParams().get("next") ?? "";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state?.message && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="control" placeholder="you@example.gov.pk" />
      </Field>
      <Field label="Password" htmlFor="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className="control" placeholder="••••••••" />
      </Field>
      <button type="submit" disabled={pending} className="btn-primary w-full py-3">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
