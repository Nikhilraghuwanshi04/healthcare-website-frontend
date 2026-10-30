import type { AppointmentStatus } from '@/types/appointment';
import type { ConsultationMode } from '@/types/common';
import { Badge, type BadgeTone } from '@/components/ui/badge';

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: BadgeTone; note: string }> = {
  pending: {
    label: 'Awaiting confirmation',
    tone: 'warning',
    note: 'The clinic still needs to accept this request.',
  },
  confirmed: { label: 'Confirmed', tone: 'success', note: 'Your slot is held for this time.' },
  completed: { label: 'Completed', tone: 'info', note: 'This consultation has already taken place.' },
  cancelled: { label: 'Cancelled', tone: 'danger', note: 'This slot is no longer held.' },
};

export const MODE_LABEL: Record<ConsultationMode, string> = {
  in_person: 'In person',
  video: 'Video call',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Badge>;
}
