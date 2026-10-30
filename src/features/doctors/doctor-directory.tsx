'use client';

import { useState } from 'react';
import { SearchX, SlidersHorizontal } from 'lucide-react';

import { DoctorCard } from './doctor-card';
import { Button } from '@/components/ui/button';
import { Checkbox, Input, Select } from '@/components/ui/input';
import { DoctorCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { MODE_LABEL } from '@/features/appointments/appointment-status';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { cn } from '@/lib/utils';
import { listCities, listDoctors, listSpecialties } from '@/services/doctor-service';
import type { ConsultationMode } from '@/types/common';
import type { DoctorSearchQuery, DoctorSortKey } from '@/types/doctor';

const SORT_OPTIONS: { value: DoctorSortKey; label: string }[] = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'soonest', label: 'Soonest available' },
  { value: 'fee_asc', label: 'Fee: low to high' },
  { value: 'fee_desc', label: 'Fee: high to low' },
  { value: 'experience', label: 'Most experienced' },
];

const FEE_PRESETS: { value: string; label: string }[] = [
  { value: '', label: 'Any consultation fee' },
  { value: '800', label: 'Up to ₹800' },
  { value: '1200', label: 'Up to ₹1,200' },
  { value: '2000', label: 'Up to ₹2,000' },
];

const MODES: ConsultationMode[] = ['in_person', 'video'];

/** URL query params → the shape the service expects. Absent values stay unset. */
function toFee(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function DoctorDirectory({ initialQuery }: { initialQuery: DoctorSearchQuery }) {
  const [query, setQuery] = useState<DoctorSearchQuery>(initialQuery);
  const [searchDraft, setSearchDraft] = useState(initialQuery.search ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const results = useAsyncQuery(() => listDoctors(query), JSON.stringify(query));
  const facets = useAsyncQuery(
    async () => ({ specialties: await listSpecialties(), cities: await listCities() }),
    'doctor-facets',
  );

  function patch(next: Partial<DoctorSearchQuery>) {
    setQuery((current) => ({ ...current, ...next }));
  }

  function clearFilters() {
    setQuery({ sort: query.sort });
    setSearchDraft('');
  }

  const doctors = results.data ?? [];
  const activeFilterCount =
    (query.search ? 1 : 0) +
    (query.specialtyId ? 1 : 0) +
    (query.city ? 1 : 0) +
    (query.maxFeeInr != null ? 1 : 0) +
    (query.modes?.length ?? 0) +
    (query.acceptingNewPatientsOnly ? 1 : 0);

  const filters = (
    <div className="space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          patch({ search: searchDraft.trim() || undefined });
        }}
        className="space-y-2"
      >
        <label htmlFor="doctor-search" className="block text-sm font-medium text-ink-700">
          Search
        </label>
        <Input
          id="doctor-search"
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Name, specialty or city"
        />
        <Button type="submit" size="sm" variant="outline" className="w-full">
          Apply search
        </Button>
      </form>

      <div className="space-y-2">
        <label htmlFor="filter-specialty" className="block text-sm font-medium text-ink-700">
          Specialty
        </label>
        <Select
          id="filter-specialty"
          value={query.specialtyId ?? ''}
          onChange={(event) => patch({ specialtyId: event.target.value || null })}
          disabled={facets.isLoading}
        >
          <option value="">All specialties</option>
          {(facets.data?.specialties ?? []).map((specialty) => (
            <option key={specialty.id} value={specialty.id}>
              {specialty.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="filter-city" className="block text-sm font-medium text-ink-700">
          City
        </label>
        <Select
          id="filter-city"
          value={query.city ?? ''}
          onChange={(event) => patch({ city: event.target.value || null })}
          disabled={facets.isLoading}
        >
          <option value="">All cities</option>
          {(facets.data?.cities ?? []).map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="filter-fee" className="block text-sm font-medium text-ink-700">
          Fee
        </label>
        <Select
          id="filter-fee"
          value={query.maxFeeInr == null ? '' : String(query.maxFeeInr)}
          onChange={(event) => patch({ maxFeeInr: toFee(event.target.value) })}
        >
          {FEE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink-700">Consultation mode</legend>
        {MODES.map((mode) => (
          <label key={mode} className="flex items-center gap-2 text-sm text-ink-800">
            <Checkbox
              checked={query.modes?.includes(mode) ?? false}
              onChange={(event) => {
                const current = query.modes ?? [];
                const next = event.target.checked ? [...current, mode] : current.filter((candidate) => candidate !== mode);
                patch({ modes: next.length > 0 ? next : undefined });
              }}
            />
            {MODE_LABEL[mode]}
          </label>
        ))}
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-ink-800">
        <Checkbox
          className="mt-0.5"
          checked={query.acceptingNewPatientsOnly ?? false}
          onChange={(event) => patch({ acceptingNewPatientsOnly: event.target.checked || undefined })}
        />
        Only showing accepting new patients
      </label>

      <div className="space-y-2">
        <label htmlFor="filter-sort" className="block text-sm font-medium text-ink-700">
          Sort by
        </label>
        <Select
          id="filter-sort"
          value={query.sort ?? 'rating'}
          onChange={(event) => patch({ sort: event.target.value as DoctorSortKey })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-24">
        <div className="lg:hidden">
          <Button
            variant="outline"
            className="w-full"
            aria-expanded={filtersOpen}
            aria-controls="doctor-filters"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal aria-hidden className="h-4 w-4" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>
        <div className={cn('card-surface p-5 lg:block', filtersOpen ? 'mt-3 block' : 'hidden')}>
          <h2 className="mb-4 text-sm font-semibold text-ink-900">Refine results</h2>
          {filters}
        </div>
      </aside>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-600" role="status" aria-live="polite">
            {results.isLoading
              ? 'Loading doctors…'
              : `${doctors.length} ${doctors.length === 1 ? 'doctor matches' : 'doctors match'}`}
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Reset filters
          </Button>
        </div>

        {results.isLoading ? (
          <ul className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={`directory-skeleton-${index}`}>
                <DoctorCardSkeleton />
              </li>
            ))}
          </ul>
        ) : results.error ? (
          <ErrorState
            title="The directory could not be loaded"
            message="The mock doctor catalogue did not respond. Try again."
            onRetry={results.refetch}
          />
        ) : doctors.length === 0 ? (
          <EmptyState
            title="No doctors match those filters"
            description="Try a different specialty or city, raise the fee limit, or clear the filters to see the whole directory."
            icon={<SearchX aria-hidden className="h-5 w-5" />}
            action={
              <Button type="button" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {doctors.map((doctor) => (
              <li key={doctor.id}>
                <DoctorCard doctor={doctor} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
