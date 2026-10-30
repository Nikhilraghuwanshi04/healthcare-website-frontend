import type { ReactNode } from 'react';

import { PortalLayout } from '@/components/layout/portal-layout';

export default function PatientGroupLayout({ children }: { children: ReactNode }) {
  return <PortalLayout role="patient">{children}</PortalLayout>;
}
