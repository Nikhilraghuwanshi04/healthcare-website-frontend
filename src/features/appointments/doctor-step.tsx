'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DoctorCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatDayLabel, formatClock } from '@/lib/dates';
import { cn, formatINR } from '@/lib/utils';
import { listDoctors } from '@/services/doctor-service';
import type { DoctorSummary } from '@/types/doctor';

function DoctorRow({
  doctor,
  selected,
  onSelect,
}: {
  doctor: DoctorSummary;
  selected: boolean;
  onSelect: (doctor: DoctorSummary) => void;
}) {
  const next = doctor.nextAvailableSlotAt ? new Date(doctor.nextAvailableSlotAt) : null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(doctor)}
        aria-pressed={selected}
        className={cn(
          'flex w-full items-center gap-3 rounded-field border px-4 py-3 text-left transition-colors',
          selected ? 'border-brand-600 bg-brand-50' : 'border-ink-200 bg-white hover:border-ink-400',
        )}
      >
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-300 text-transparent',
          )}
          aria-hidden
        >
          <Check className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">{doctor.name}</span>
          <span className="block truncate text-xs text-ink-500">
            {doctor.specialtyName} · {doctor.city} · {formatINR(doctor.consultationFeeInr)}
            {next ? ` · next ${formatDayLabel(next)} ${formatClock(next)}` : ' · no slots this month'}
          </span>
          {!doctor.acceptingNewPatients ? (
            <span className="mt-1 block text-xs font-medium text-amber-700">Not accepting new patients</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

/** Step 1: pick the doctor, reusing the same search service as the directory. */
export function DoctorStep({
  selectedDoctorId,
  onSelect,
  onContinue,
}: {
  selectedDoctorId: string | null;
  onSelect: (doctorId: string) => void;
  onContinue: () => void;
}) {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const { data, error, isLoading, refetch } = useAsyncQuery(() => listDoctors({ search: query || undefined }), query);

  const doctors = data ?? [];
  const selected = doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(term.trim());
        }}
        className="flex gap-2"
      >
        <label htmlFor="booking-doctor-search" className="sr-only">
          Search doctors by name, specialty or city
        </label>
        <Input
          id="booking-doctor-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search by name, specialty or city"
        />
        <Button type="submit" variant="outline">
          <Search aria-hidden className="h-4 w-4" />
          Search
        </Button>
      </form>

      {isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={`booking-doctor-skeleton-${index}`}>
              <DoctorCardSkeleton />
            </li>
          ))}
        </ul>
      ) : error ? (
        <ErrorState title="Doctors unavailable" message="The mock service did not respond." onRetry={refetch} />
      ) : doctors.length === 0 ? (
        <EmptyState
          title="No doctor matches that search"
          description="Clear the search or browse the full directory instead."
          action={
            <Link
              href="/doctors"
              className="rounded-field border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              Open the directory
            </Link>
          }
        />
      ) : (
        <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {doctors.map((doctor) => (
            <DoctorRow
              key={doctor.id}
              doctor={doctor}
              selected={doctor.id === selectedDoctorId}
              onSelect={(picked) => onSelect(picked.id)}
            />
          ))}
        </ul>
      )}

      <Button type="button" disabled={!selected} onClick={onContinue}>
        Continue to slots
      </Button>
    </div>
  );
}
