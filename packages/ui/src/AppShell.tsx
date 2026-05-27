import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

export type NavItem = { to: string; label: string };

export function AppShell({
  appName,
  navItems,
  userLabel,
  onLogout,
  children,
}: {
  appName: string;
  navItems: NavItem[];
  userLabel?: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <aside className="flex w-56 flex-col border-r border-[var(--color-border)] bg-white">
        <div className="border-b border-[var(--color-border)] px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            SmurfElite
          </p>
          <p className="text-lg font-bold text-[var(--color-text)]">{appName}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3">
          {userLabel ? (
            <p className="mb-2 truncate text-xs text-[var(--color-text-muted)]">
              {userLabel}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onLogout}
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-surface-muted)]"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
