'use client';

import { useState } from 'react';
import { Search, ShieldCheck, Stethoscope, UserPlus } from 'lucide-react';

import { DoctorFormDialog } from './doctor-form-dialog';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckboxRow } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { specialtyNameOf } from '@/data/specialties';
import { messageOf } from '@/lib/errors';
import { formatINR } from '@/lib/utils';
import {
  adminSetDoctorVerified,
  getDoctor,
  listCities,
  listDoctors,
  listSpecialties,
} from '@/services/doctor-service';
import type { Doctor, DoctorSearchQuery, DoctorSortKey } from '@/types/doctor';

const SORT_OPTIONS: { value: DoctorSortKey; label: string }[] = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'fee_asc', label: 'Fee: low to high' },
  { value: 'fee_desc', label: 'Fee: high to low' },
  { value: 'soonest', label: 'Soonest available' },
];

export type VerificationFilter = 'all' | 'verified' | 'unverified';

export interface AdminDoctorFilter {
  verification: VerificationFilter;
  acceptingNewPatientsOnly: boolean;
}

/**
 * The verification flag and the new-patient flag live on the full doctor record,
 * so this narrows what the search service already returned. Kept pure so the
 * rule can be unit tested without React.
 */
export function applyAdminDoctorFilters(doctors: Doctor[], filter: AdminDoctorFilter): Doctor[] {
  return doctors.filter((doctor) => {
    if (filter.acceptingNewPatientsOnly && !doctor.acceptingNewPatients) return false;
    if (filter.verification === 'verified') return doctor.profileVerifiedAt !== null;
    if (filter.verification === 'unverified') return doctor.profileVerifiedAt === null;
    return true;
  });
}

function isVerified(doctor: Doctor): boolean {
  return doctor.profileVerifiedAt !== null;
}

export function AdminDoctorsTable() {
  const toast = useToast();
  const [query, setQuery] = useState<DoctorSearchQuery>({ sort: 'rating' });
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<AdminDoctorFilter>({
    verification: 'all',
    acceptingNewPatientsOnly: false,
  });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ doctor?: Doctor } | null>(null);

  const doctorsQuery = useAsyncQuery(async () => {
    const summaries = await listDoctors(query);
    // DoctorSummary has no verification column, so the admin view joins the
    // record itself and keeps the order the service already sorted.
    return Promise.all(summaries.map((summary) => getDoctor(summary.id)));
  }, JSON.stringify(query));

  const facets = useAsyncQuery(
    async () => ({ specialties: await listSpecialties(), cities: await listCities() }),
    'admin-doctor-facets',
  );

  const records = doctorsQuery.data ?? [];
  const visible = applyAdminDoctorFilters(records, filter);

  function patch(next: Partial<DoctorSearchQuery>) {
    setQuery((current) => ({ ...current, ...next }));
  }

  function toggleVerified(doctor: Doctor) {
    const nextVerified = !isVerified(doctor);
    setPendingId(doctor.id);

    adminSetDoctorVerified(doctor.id, nextVerified)
      .then(() => {
        toast.success(
          nextVerified ? 'Marked verified (demo)' : 'Verification flag cleared (demo)',
          `${doctor.name}: only the local record changed. No credential check, background verification or email was performed.`,
        );
      })
      .catch((error: unknown) => {
        toast.error('Could not update the demo flag', messageOf(error, 'Please try again.'));
      })
      .finally(() => {
        setPendingId(null);
        doctorsQuery.refetch();
      });
  }

  const controls = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SegmentedControl<VerificationFilter>
          label="Filter doctors by the demo verification flag"
          value={filter.verification}
          onChange={(verification) => setFilter((current) => ({ ...current, verification }))}
          options={[
            { value: 'all', label: 'All', count: records.length },
            { value: 'verified', label: 'Verified', count: records.filter(isVerified).length },
            { value: 'unverified', label: 'Not verified', count: records.filter((doctor) => !isVerified(doctor)).length },
          ]}
        />
        <Button size="sm" onClick={() => setDialog({})}>
          <UserPlus aria-hidden className="h-4 w-4" />
          Add doctor
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            patch({ search: term.trim() || undefined });
          }}
          className="flex w-full max-w-sm gap-2"
        >
          <label htmlFor="admin-doctor-search" className="sr-only">
            Search doctors by name, specialty or city
          </label>
          <Input
            id="admin-doctor-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search name, specialty or city"
          />
          <Button type="submit" variant="outline" size="sm">
            <Search aria-hidden className="h-4 w-4" />
            Search
          </Button>
        </form>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">Specialty</span>
          <Select
            value={query.specialtyId ?? ''}
            disabled={facets.isLoading}
            onChange={(event) => patch({ specialtyId: event.target.value || null })}
          >
            <option value="">All specialties</option>
            {(facets.data?.specialties ?? []).map((specialty) => (
              <option key={specialty.id} value={specialty.id}>
                {specialty.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">City</span>
          <Select
            value={query.city ?? ''}
            disabled={facets.isLoading}
            onChange={(event) => patch({ city: event.target.value || null })}
          >
            <option value="">All cities</option>
            {(facets.data?.cities ?? []).map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </label>

        <label className="space-y-1 text-sm text-ink-700">
          <span className="block font-medium">Sort by</span>
          <Select
            value={query.sort ?? 'rating'}
            onChange={(event) => patch({ sort: event.target.value as DoctorSortKey })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>

        <div className="pb-1">
          <CheckboxRow
            id="admin-doctor-accepting"
            label="Only accepting new patients"
            checked={filter.acceptingNewPatientsOnly}
            onChange={(event) =>
              setFilter((current) => ({ ...current, acceptingNewPatientsOnly: event.target.checked }))
            }
          />
        </div>
      </div>
    </div>
  );

  if (doctorsQuery.error) {
    return (
      <div className="space-y-5">
        {controls}
        <ErrorState
          title="Doctor records unavailable"
          message="The mock doctor service did not respond. Try again."
          onRetry={doctorsQuery.refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {controls}

      {doctorsQuery.isLoading ? (
        <Table caption="Loading doctor records">
          <THead>
            <DoctorHead />
          </THead>
          <TBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRowSkeleton key={`admin-doctor-skeleton-${index}`} columns={8} />
            ))}
          </TBody>
        </Table>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No doctor record matches"
          description="Clear the search, widen the specialty or city filter, or switch the verification tab back to All."
          icon={<Stethoscope aria-hidden className="h-5 w-5" />}
        />
      ) : (
        <Table caption="Every doctor record in the mock clinic directory">
          <THead>
            <DoctorHead />
          </THead>
          <TBody>
            {visible.map((doctor) => (
              <DoctorRow
                key={doctor.id}
                doctor={doctor}
                pending={pendingId === doctor.id}
                onEdit={() => setDialog({ doctor })}
                onToggleVerified={() => toggleVerified(doctor)}
              />
            ))}
          </TBody>
        </Table>
      )}

      <p className="text-xs text-ink-500">
        Showing {visible.length} of {records.length} mock doctor record{records.length === 1 ? '' : 's'}. The
        verification flag is a demo label on a local record — no background check happens in this build.
      </p>

      {dialog ? (
        <DoctorFormDialog
          key={dialog.doctor?.id ?? 'create'}
          mode={dialog.doctor ? 'edit' : 'create'}
          doctor={dialog.doctor}
          open
          onClose={() => setDialog(null)}
          onSaved={() => doctorsQuery.refetch()}
        />
      ) : null}
    </div>
  );
}

function DoctorHead() {
  return (
    <Tr>
      <Th>Doctor</Th>
      <Th>Specialty</Th>
      <Th>City</Th>
      <Th>Fee</Th>
      <Th>Experience</Th>
      <Th>Rating</Th>
      <Th>Status</Th>
      <Th>Actions</Th>
    </Tr>
  );
}

function DoctorRow({
  doctor,
  pending,
  onEdit,
  onToggleVerified,
}: {
  doctor: Doctor;
  pending: boolean;
  onEdit: () => void;
  onToggleVerified: () => void;
}) {
  const verified = isVerified(doctor);

  return (
    <Tr className={verified ? undefined : 'bg-amber-50/50'}>
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={doctor.name} seed={doctor.id} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-ink-900">{doctor.name}</p>
            <p className="truncate text-xs text-ink-500">{doctor.credentials}</p>
          </div>
        </div>
      </Td>
      <Td>{specialtyNameOf(doctor.specialtyId)}</Td>
      <Td>{doctor.location.city}</Td>
      <Td>{formatINR(doctor.consultationFeeInr)}</Td>
      <Td>{doctor.experienceYears} yr</Td>
      <Td>
        {doctor.reviewCount > 0 ? `${doctor.rating.toFixed(1)} · ${doctor.reviewCount}` : 'Not rated yet'}
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={doctor.acceptingNewPatients ? 'success' : 'neutral'}>
            {doctor.acceptingNewPatients ? 'Accepting new patients' : 'Closed to new patients'}
          </Badge>
          <Badge tone={verified ? 'brand' : 'warning'}>
            <ShieldCheck aria-hidden className="h-3.5 w-3.5" />
            {verified ? 'Verified (demo flag)' : 'Not verified'}
          </Badge>
        </div>
      </Td>
      <Td>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant={verified ? 'ghost' : 'primary'} size="sm" loading={pending} onClick={onToggleVerified}>
            {verified ? 'Unverify' : 'Verify'}
          </Button>
        </div>
      </Td>
    </Tr>
  );
}
