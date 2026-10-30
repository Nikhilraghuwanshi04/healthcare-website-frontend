'use client';

import { useState } from 'react';
import { Search, Users } from 'lucide-react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { TableRowSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/ui/table';
import { useAsyncQuery } from '@/hooks/use-async-query';
import { formatDate, fromIsoDate } from '@/lib/dates';
import { listPatients } from '@/services/patient-service';
import type { PatientProfile } from '@/types/user';

const PAGE_SIZE = 8;

export type AdminPatientSortKey = 'name' | 'city';

export interface AdminPatientFilter {
  search: string;
  sort: AdminPatientSortKey;
}

const DEFAULT_FILTER: AdminPatientFilter = { search: '', sort: 'name' };

/** Name, email or mobile number — matched against the stored record as text. */
export function matchesPatientSearch(patient: PatientProfile, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return `${patient.fullName} ${patient.email} ${patient.phone}`.toLowerCase().includes(needle);
}

export function applyPatientFilters(patients: PatientProfile[], filter: AdminPatientFilter): PatientProfile[] {
  const matched = patients.filter((patient) => matchesPatientSearch(patient, filter.search));

  return matched.sort((a, b) => {
    if (filter.sort === 'city') {
      return a.address.city.localeCompare(b.address.city) || a.fullName.localeCompare(b.fullName);
    }
    return a.fullName.localeCompare(b.fullName);
  });
}

/** Clamps out-of-range pages so a shrinking result set can never render an empty slice. */
export function paginatePatients(patients: PatientProfile[], page: number, pageSize = PAGE_SIZE): PatientProfile[] {
  const lastPage = Math.max(1, Math.ceil(patients.length / pageSize));
  const safePage = Math.min(Math.max(1, page), lastPage);
  return patients.slice((safePage - 1) * pageSize, safePage * pageSize);
}

export function AdminPatientsTable() {
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState<AdminPatientFilter>(DEFAULT_FILTER);
  const [page, setPage] = useState(1);

  const patientsQuery = useAsyncQuery(listPatients, 'admin-patients');
  const patients = patientsQuery.data ?? [];
  const filtered = applyPatientFilters(patients, filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const visible = paginatePatients(filtered, currentPage);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const controls = (
    <div className="flex flex-wrap items-end gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFilter((current) => ({ ...current, search: term.trim() }));
          setPage(1);
        }}
        className="flex w-full max-w-sm gap-2"
      >
        <label htmlFor="admin-patient-search" className="sr-only">
          Search patients by name, email or phone
        </label>
        <Input
          id="admin-patient-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search name, email or phone"
        />
        <Button type="submit" variant="outline" size="sm">
          <Search aria-hidden className="h-4 w-4" />
          Search
        </Button>
      </form>

      <label className="space-y-1 text-sm text-ink-700">
        <span className="block font-medium">Sort by</span>
        <Select
          value={filter.sort}
          onChange={(event) => {
            setFilter((current) => ({ ...current, sort: event.target.value as AdminPatientSortKey }));
            setPage(1);
          }}
        >
          <option value="name">Name (A–Z)</option>
          <option value="city">City (A–Z)</option>
        </Select>
      </label>

      {filter.search ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTerm('');
            setFilter((current) => ({ ...current, search: '' }));
            setPage(1);
          }}
        >
          Clear search
        </Button>
      ) : null}
    </div>
  );

  if (patientsQuery.error) {
    return (
      <div className="space-y-5">
        {controls}
        <ErrorState
          title="Patient records unavailable"
          message="The mock patient service did not respond. Try again."
          onRetry={patientsQuery.refetch}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {controls}

      {patientsQuery.isLoading ? (
        <Table caption="Loading patient records">
          <THead>
            <PatientHead />
          </THead>
          <TBody>
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <TableRowSkeleton key={`admin-patient-skeleton-${index}`} columns={7} />
            ))}
          </TBody>
        </Table>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No patient matches that search"
          description="Matching covers the stored name, email address and mobile number. Clear it to see the full register."
          icon={<Users aria-hidden className="h-5 w-5" />}
        />
      ) : (
        <>
          <PatientTable caption="Every patient record in the mock store, shown exactly as stored" rows={visible} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-ink-500">
              Showing {rangeStart}–{rangeEnd} of {filtered.length} patient{filtered.length === 1 ? '' : 's'} in the
              mock store.
            </p>
            <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
          </div>
        </>
      )}

      <p className="rounded-field bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
        Read-only by design: patients own their details and edit them through their own account. This portal displays
        the stored values as-is and never reinterprets them, and no message is sent from this screen.
      </p>
    </div>
  );
}

function PatientHead() {
  return (
    <Tr>
      <Th>Patient</Th>
      <Th>Email</Th>
      <Th>Phone</Th>
      <Th>Date of birth</Th>
      <Th>City</Th>
      <Th>Blood group</Th>
      <Th>Emergency contact</Th>
    </Tr>
  );
}

function PatientTable({ caption, rows }: { caption: string; rows: PatientProfile[] }) {
  return (
    <Table caption={caption}>
      <THead>
        <PatientHead />
      </THead>
      <TBody>
        {rows.map((patient) => (
          <PatientRow key={patient.id} patient={patient} />
        ))}
      </TBody>
    </Table>
  );
}

function PatientRow({ patient }: { patient: PatientProfile }) {
  const birthDate = fromIsoDate(patient.dateOfBirth);
  const hasEmergencyContact = patient.emergencyContact !== null;

  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={patient.fullName} seed={patient.id} size="sm" />
          <span className="font-medium text-ink-900">{patient.fullName}</span>
        </div>
      </Td>
      <Td className="break-all">{patient.email}</Td>
      <Td>{patient.phone}</Td>
      <Td>{Number.isNaN(birthDate.getTime()) ? patient.dateOfBirth : formatDate(birthDate)}</Td>
      <Td>{patient.address.city || '—'}</Td>
      <Td>{patient.bloodGroup ?? 'Not on file'}</Td>
      <Td>
        <Badge tone={hasEmergencyContact ? 'success' : 'neutral'}>
          {hasEmergencyContact ? 'On file' : 'Not provided'}
        </Badge>
      </Td>
    </Tr>
  );
}
