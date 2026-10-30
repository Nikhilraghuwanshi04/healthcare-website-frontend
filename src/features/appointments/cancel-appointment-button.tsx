'use client';

import { useState } from 'react';

import { CancelAppointmentDialog } from './cancel-appointment-dialog';
import { Button, type ButtonSize } from '@/components/ui/button';
import type { Appointment, CancellationActor } from '@/types/appointment';

/** Opens the cancellation dialog for one appointment; reused by every role area. */
export function CancelAppointmentButton({
  appointment,
  actor,
  size = 'sm',
  onCancelled,
}: {
  appointment: Appointment;
  actor: CancellationActor;
  size?: ButtonSize;
  onCancelled?: (appointment: Appointment) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        Cancel
      </Button>
      {open ? (
        <CancelAppointmentDialog
          appointment={appointment}
          actor={actor}
          open={open}
          onClose={() => setOpen(false)}
          onCancelled={(cancelled) => {
            onCancelled?.(cancelled);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
