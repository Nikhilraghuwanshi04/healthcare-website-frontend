import Link from 'next/link';
import { Suspense } from 'react';
import { CalendarCheck2, Search, ShieldCheck, Stethoscope } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { FeaturedDoctors } from '@/features/doctors/featured-doctors';
import { OpenSlotsPanel } from '@/features/doctors/open-slots-panel';
import { SpecialtyGrid } from '@/features/doctors/specialty-grid';

const STEPS = [
  {
    icon: Search,
    title: 'Search doctors',
    body: 'Filter by specialty, city, consultation mode or fee, then compare ratings and experience.',
  },
  {
    icon: Stethoscope,
    title: 'Pick a slot',
    body: 'Open a profile to see real availability for the next three weeks, in person or video.',
  },
  {
    icon: CalendarCheck2,
    title: 'Review and confirm',
    body: 'Enter the patient details, check the summary, and the appointment appears on your dashboard.',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-20">
      <section className="relative overflow-hidden border-b border-ink-200 bg-white">
        <div className="grid page-container items-center gap-8 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-200">
              <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
              Demo environment · mock data, no real appointments
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Find the right doctor and book a slot in minutes.
            </h1>
            <p className="max-w-[52rem] text-base text-ink-600">
              Medibook brings clinic availability, patient details and appointment history into one flow — so
              scheduling never happens across three apps and a phone call.
            </p>

            <form action="/doctors" method="get" className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor="hero-search" className="sr-only">
                Search by doctor name, specialty or city
              </label>
              <input
                id="hero-search"
                name="search"
                type="search"
                placeholder="Cardiologist in Pune, Dr. Rao…"
                className="h-12 flex-1 rounded-field border border-ink-300 bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 hover:border-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
              <button type="submit" className="h-12 rounded-field bg-brand-600 px-6 text-sm font-medium text-white hover:bg-brand-700">
                Search doctors
              </button>
            </form>

            <p className="text-sm text-ink-500">
              Or jump straight to a <Link href="/doctors" className="font-medium text-brand-700 hover:underline">full doctor directory</Link>.
            </p>
          </div>

          <div className="hidden lg:block">
            <Suspense
              fallback={
                <div className="relative space-y-3 rounded-card border border-ink-200 bg-white p-5 shadow-raised">
                  <Skeleton className="h-4 w-36" />
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton key={`home-open-slot-${index}`} className="h-14" />
                  ))}
                </div>
              }
            >
              <OpenSlotsPanel />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="page-container space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">How booking works</h2>
          <p className="text-sm text-ink-600">Three steps, no phone calls, no waiting rooms.</p>
        </div>
        <ol className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card-surface space-y-3 p-5">
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">
                  <step.icon aria-hidden className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Step {index + 1}</span>
              </span>
              <h3 className="text-base font-semibold text-ink-900">{step.title}</h3>
              <p className="text-sm text-ink-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="page-container space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-900">Top rated this week</h2>
            <p className="text-sm text-ink-600">Ratings come from the demo dataset, not verified patients.</p>
          </div>
          <Link href="/doctors" className="text-sm font-medium text-brand-700 hover:underline">
            Browse all doctors
          </Link>
        </div>
        <Suspense
          fallback={
            <ul className="grid gap-5 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={`home-featured-${index}`}>
                  <Skeleton className="h-56" />
                </li>
              ))}
            </ul>
          }
        >
          <FeaturedDoctors />
        </Suspense>
      </section>

      <section className="page-container space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">Browse by specialty</h2>
          <p className="text-sm text-ink-600">Every specialty in the demo clinic network.</p>
        </div>
        <Suspense
          fallback={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={`home-specialty-${index}`} className="h-24" />
              ))}
            </div>
          }
        >
          <SpecialtyGrid />
        </Suspense>
      </section>
    </div>
  );
}
