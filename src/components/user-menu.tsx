import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { getCurrentUser } from "@/lib/data";

export async function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = await getCurrentUser();
  const initial = (user.email[0] ?? "U").toUpperCase();

  if (compact) {
    return (
      <form action={signOut}>
        <button
          type="submit"
          title={`Sign out (${user.email})`}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-brand-100 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Sign out</span>
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/6 p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-500 text-sm font-semibold text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-brand-100/60">Signed in as</p>
        <p className="truncate text-sm font-medium text-white" title={user.email}>
          {user.email}
        </p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          title="Sign out"
          className="grid size-8 place-items-center rounded-lg text-brand-100/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="sr-only">Sign out</span>
        </button>
      </form>
    </div>
  );
}

export function UserMenuFallback() {
  return <div className="h-[60px] animate-pulse rounded-xl bg-white/6" />;
}
