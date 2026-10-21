import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Setup required" };

const steps = [
  "Create a project at supabase.com.",
  "Open SQL Editor and run the file supabase/schema.sql from this project.",
  "Copy .env.example to .env.local and fill in your project URL and publishable (anon) key.",
  "Create a staff account under Authentication → Users → Add user.",
  "Restart the dev server (npm run dev).",
];

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Logo light={false} />
      <div className="card mt-8 p-6">
        <h1 className="text-xl font-semibold text-ink">Connect Supabase to continue</h1>
        <p className="mt-1 text-sm text-ink-2">
          The app could not find Supabase environment variables.
        </p>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm text-ink-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
