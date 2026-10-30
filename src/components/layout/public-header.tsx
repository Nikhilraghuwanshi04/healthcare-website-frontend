'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';

import { SiteLogo } from './site-logo';
import { Menu } from '@/components/ui/menu';
import { buttonVariants } from '@/components/ui/button';
import { ROLE_HOME, ROLE_LABEL } from '@/components/layout/nav-config';
import { useSession } from '@/features/auth/session-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/doctors', label: 'Find doctors' },
];

/**
 * Reads the pathname in the smallest possible leaf so the rest of the public
 * layout can still prerender (cacheComponents requirement).
 */
function PrimaryNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {PUBLIC_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'rounded-field px-3 py-2 text-sm font-medium hover:bg-ink-100',
                active ? 'text-brand-800' : 'text-ink-700',
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NavFallback() {
  return (
    <ul className="flex items-center gap-1">
      {PUBLIC_LINKS.map((link) => (
        <li key={link.href}>
          <Skeleton className="h-9 w-24" />
        </li>
      ))}
    </ul>
  );
}

export function PublicHeader() {
  const { session, signOut } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSignOut() {
    signOut();
    router.replace('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="flex page-container items-center justify-between gap-4 py-3">
        <SiteLogo />

        <nav aria-label="Primary" className="hidden md:block">
          <Suspense fallback={<NavFallback />}>
            <PrimaryNavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link href={ROLE_HOME[session.role]} className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
                {ROLE_LABEL[session.role]} dashboard
              </Link>
              <Menu
                label="Account menu"
                className="sm:hidden"
                trigger={<span className="truncate">{session.displayName.split(' ')[0]}</span>}
                items={[
                  { id: 'dashboard', label: 'Open dashboard', onSelect: () => router.push(ROLE_HOME[session.role]) },
                  { id: 'sign-out', label: 'Sign out (demo)', tone: 'danger', onSelect: handleSignOut },
                ]}
              />
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden items-center sm:inline-flex')}
              >
                <LogOut aria-hidden className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
                Sign in
              </Link>
              <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
                Create account
              </Link>
            </>
          )}

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-field border border-ink-300 px-2.5 py-1.5 text-sm text-ink-700 md:hidden"
          >
            {mobileOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="public-mobile-nav" className="border-t border-ink-200 bg-white px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <PrimaryNavLinks onNavigate={() => setMobileOpen(false)} />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className="rounded-field p-1.5 text-ink-500 hover:bg-ink-100"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {session ? (
              <>
                <Link
                  href={ROLE_HOME[session.role]}
                  onClick={() => setMobileOpen(false)}
                  className={cn(buttonVariants({ size: 'sm' }), 'w-full')}
                >
                  {ROLE_LABEL[session.role]} dashboard
                </Link>
                <button type="button" onClick={handleSignOut} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}>
                  Sign out (demo)
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}>
                  Sign in
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className={cn(buttonVariants({ size: 'sm' }), 'w-full')}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
