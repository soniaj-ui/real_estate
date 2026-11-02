import type { Metadata } from 'next';
import { MyListings } from '@/components/MyListings';

export const metadata: Metadata = {
  title: 'My listings',
  robots: { index: false },
};

export default function MyListingsPage() {
  return <MyListings />;
}
