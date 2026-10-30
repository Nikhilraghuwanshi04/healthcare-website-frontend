import type { ReactNode } from 'react';

import { PortalLayout } from '@/components/layout/portal-layout';

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return <PortalLayout role="admin">{children}</PortalLayout>;
}
