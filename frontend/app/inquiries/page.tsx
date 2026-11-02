import type { Metadata } from 'next';
import { InquiriesList } from '@/components/InquiriesList';

export const metadata: Metadata = {
  title: 'Inquiries',
  robots: { index: false },
};

export default function InquiriesPage() {
  return <InquiriesList />;
}
