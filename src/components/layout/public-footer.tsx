import Link from 'next/link';

import { SiteLogo } from './site-logo';

export function PublicFooter() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <div className="flex page-container flex-col gap-6 py-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <SiteLogo />
          <p className="max-w-sm text-sm text-ink-500">
            A frontend demo of a healthcare appointment platform. Doctor records, availability and bookings are mock
            data — no real appointment, payment, message or email is created, and no medical advice is given.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-8 text-sm">
          <ul className="space-y-2">
            <li className="font-medium text-ink-900">Care</li>
            <li>
              <Link href="/doctors" className="text-ink-600 hover:text-ink-900">
                Find doctors
              </Link>
            </li>
            <li>
              <Link href="/signup" className="text-ink-600 hover:text-ink-900">
                Create an account
              </Link>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="font-medium text-ink-900">Demo access</li>
            <li>
              <Link href="/login" className="text-ink-600 hover:text-ink-900">
                Patient, doctor and admin sign-in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-ink-200 py-4 text-xs text-ink-500">
        <p className="page-container">
          In an emergency, call your local emergency number. This application is not a clinical service.
        </p>
      </div>
    </footer>
  );
}
