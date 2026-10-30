import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { listSpecialties } from '@/services/doctor-service';

/**
 * Server component: the specialty list comes from the mock service, and the
 * home page streams it in behind a Suspense boundary.
 */
export async function SpecialtyGrid() {
  const specialties = await listSpecialties();

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {specialties.map((specialty) => (
        <li key={specialty.id}>
          <Link
            href={`/doctors?specialtyId=${specialty.id}`}
            className="card-surface group flex h-full flex-col gap-2 p-4 hover:border-brand-300"
          >
            <span className="flex items-center justify-between gap-2 text-sm font-semibold text-ink-900">
              {specialty.name}
              <ArrowRight
                aria-hidden
                className="h-4 w-4 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
              />
            </span>
            <span className="text-sm text-ink-500">{specialty.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
