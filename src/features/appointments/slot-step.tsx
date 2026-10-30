'use client';

import { ChevronLeft } from 'lucide-react';

import { SlotPicker } from './slot-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RadioRow } from '@/components/ui/field';
import { MODE_LABEL } from './appointment-status';
import { specialtyNameOf } from '@/data/specialties';
import { formatDateTime } from '@/lib/dates';
import { cn, formatINR } from '@/lib/utils';
import type { ConsultationMode } from '@/types/common';
import type { AppointmentSlot, Doctor } from '@/types/doctor';

/** Step 2: choose a slot and a consultation mode for the chosen doctor. */
export function SlotStep({
  doctor,
  loadingDoctor,
  slots,
  loadingSlots,
  slotId,
  mode,
  onSelectSlot,
  onSelectMode,
  onChangeDoctor,
  problem,
}: {
  doctor: Doctor | null;
  loadingDoctor: boolean;
  slots: AppointmentSlot[];
  loadingSlots: boolean;
  slotId: string;
  mode: ConsultationMode | null;
  onSelectSlot: (slot: AppointmentSlot) => void;
  onSelectMode: (mode: ConsultationMode) => void;
  onChangeDoctor: () => void;
  problem: string | null;
}) {
  const selectedSlot = slots.find((slot) => slot.id === slotId) ?? null;

  return (
    <div className="space-y-5">
      {doctor ? (
        <Card>
          <CardHeader
            title={doctor.name}
            description={`${specialtyNameOf(doctor.specialtyId)} · ${formatINR(doctor.consultationFeeInr)} per visit`}
          />
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-2">
            <div className={cn('h-4 w-48 animate-pulse rounded bg-ink-200/70', !loadingDoctor && 'hidden')} />
            <p className="text-sm text-ink-500">Loading the selected doctor…</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Available times"
          description="The next three weeks of the doctor's clinic hours."
          action={
            <Button variant="ghost" size="sm" onClick={onChangeDoctor}>
              <ChevronLeft aria-hidden className="h-4 w-4" />
              Change doctor
            </Button>
          }
        />
        <CardContent className="space-y-4">
          <SlotPicker
            slots={slots}
            loading={loadingSlots}
            selectedSlotId={slotId}
            onSelect={onSelectSlot}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Consultation mode" description="Only the modes this doctor offers." />
        <CardContent className="space-y-3">
          {(doctor?.modes ?? []).map((option) => (
            <RadioRow
              key={option}
              id={`mode-${option}`}
              name="mode"
              label={MODE_LABEL[option]}
              checked={mode === option}
              onChange={() => onSelectMode(option)}
            />
          ))}
          {selectedSlot ? (
            <p className="rounded-field bg-brand-50 px-3 py-2 text-sm text-brand-900 ring-1 ring-inset ring-brand-200">
              {formatDateTime(selectedSlot.startAt)} · {selectedSlot.durationMinutes} min
            </p>
          ) : null}
          {problem ? <p className="text-sm text-rose-600">{problem}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
