import type { Metadata } from 'next';
import { NewListing } from '@/components/NewListing';

export const metadata: Metadata = {
  title: 'Post a listing',
  robots: { index: false },
};

export default function NewListingPage() {
  return <NewListing />;
}
