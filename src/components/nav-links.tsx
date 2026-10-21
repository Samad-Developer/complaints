"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePlus2, LayoutDashboard, ListChecks } from "lucide-react";
import clsx from "clsx";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/complaints", label: "All Complaints", Icon: ListChecks },
  { href: "/complaints/new", label: "New Complaint", Icon: FilePlus2 },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/complaints") {
    return pathname === "/complaints" || /^\/complaints\/\d+/.test(pathname);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ variant = "sidebar" }: { variant?: "sidebar" | "bottom" }) {
  const pathname = usePathname();

  if (variant === "bottom") {
    return (
      <nav className="grid grid-cols-3">
        {LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex flex-col items-center gap-1 px-2 pb-2 pt-2.5 text-[11px] font-medium transition",
                active ? "text-brand-700" : "text-ink-3 hover:text-ink",
              )}
            >
              <span
                className={clsx(
                  "grid h-7 w-12 place-items-center rounded-full transition",
                  active && "bg-brand-50",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-white/12 text-white shadow-[inset_2px_0_0_0_#7fd3a6]"
                : "text-brand-100/75 hover:bg-white/6 hover:text-white",
            )}
          >
            <Icon className="size-[18px] opacity-90" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
