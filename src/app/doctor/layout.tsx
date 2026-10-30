import type { ReactNode } from 'react';

import { PortalLayout } from '@/components/layout/portal-layout';

export default function DoctorGroupLayout({ children }: { children: ReactNode }) {
  return <PortalLayout role="doctor">{children}</PortalLayout>;
}
