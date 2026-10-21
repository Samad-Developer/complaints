import { Suspense, type ReactNode } from "react";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { UserMenu, UserMenuFallback } from "@/components/user-menu";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand-950 px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-8 px-1">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-brand-100/40">
            Menu
          </p>
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </div>
        <div className="mt-auto">
          <Suspense fallback={<UserMenuFallback />}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>

      {/* Mobile / tablet header */}
      <header className="sticky top-0 z-30 bg-brand-950 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <Suspense fallback={null}>
            <UserMenu compact />
          </Suspense>
        </div>
      </header>

      {/* Mobile / tablet bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(16,24,20,0.06)] backdrop-blur lg:hidden">
        <Suspense fallback={<div className="h-[62px]" />}>
          <NavLinks variant="bottom" />
        </Suspense>
      </div>

      <main className="mx-auto w-full max-w-7xl overflow-x-clip px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
