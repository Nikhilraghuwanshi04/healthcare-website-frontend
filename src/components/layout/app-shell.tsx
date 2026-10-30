'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu as MenuIcon, ExternalLink } from 'lucide-react';

import { NAV_ITEMS, ROLE_LABEL, ROLE_HOME } from './nav-config';
import { SiteLogo } from './site-logo';
import { Avatar } from '@/components/ui/avatar';
import { Dialog } from '@/components/ui/dialog';
import { Menu } from '@/components/ui/menu';
import { useSession } from '@/features/auth/session-provider';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/common';

function NavList({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {NAV_ITEMS[role].map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-field px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
              )}
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const { session, signOut } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    signOut();
    router.replace('/');
  }

  return (
    <div className="flex min-h-dvh bg-ink-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <SiteLogo href={ROLE_HOME[role]} />
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-400">{ROLE_LABEL[role]} portal</p>
        </div>
        <nav aria-label="Primary" className="flex-1 px-3">
          <NavList role={role} />
        </nav>
        <div className="space-y-3 px-5 py-5">
          <p className="rounded-field bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
            Demo environment: mock data, mock sign-in, no real appointments are created.
          </p>
          <Link
            href="/doctors"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            <ExternalLink aria-hidden className="h-4 w-4" />
            Public site
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex items-center gap-2 rounded-field border border-ink-300 px-2.5 py-1.5 text-sm text-ink-700 lg:hidden"
          >
            <MenuIcon aria-hidden className="h-4 w-4" />
            Menu
          </button>
          <p className="hidden text-sm text-ink-500 lg:block">{ROLE_LABEL[role]} workspace</p>
          <div className="flex items-center gap-2">
            {session ? (
              <Menu
                label="Account menu"
                trigger={
                  <span className="flex items-center gap-2">
                    <Avatar name={session.displayName} size="sm" />
                    <span className="hidden max-w-40 truncate sm:inline">{session.displayName}</span>
                  </span>
                }
                items={[
                  { id: 'home', label: `Go to ${ROLE_LABEL[role]} home`, onSelect: () => router.push(ROLE_HOME[role]) },
                  { id: 'sign-out', label: 'Sign out (demo)', tone: 'danger', onSelect: handleSignOut },
                ]}
              />
            ) : (
              <Link
                href="/login"
                className="rounded-field border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        <main id="main" className="page-container flex-1 space-y-6 py-6 lg:py-8">{children}</main>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title={`${ROLE_LABEL[role]} navigation`}>
        <div className="space-y-4">
          <NavList role={role} onNavigate={() => setMenuOpen(false)} />
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-700"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            Sign out (demo)
          </button>
        </div>
      </Dialog>
    </div>
  );
}
