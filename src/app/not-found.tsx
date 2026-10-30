import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-16 sm:px-6">
      <EmptyState
        title="Page not found"
        description="That address does not match any page in this demo. The link may be stale, or the record may have been reset with the mock data."
        icon={<SearchX aria-hidden className="h-5 w-5" />}
        action={
          <Link href="/doctors" className={buttonVariants({ size: 'sm' })}>
            Browse doctors
          </Link>
        }
      />
      <p className="text-center text-sm text-ink-500">
        Need help instead? <Link href="/" className="font-medium text-brand-700 hover:underline">Go to the home page</Link>
      </p>
    </div>
  );
}
