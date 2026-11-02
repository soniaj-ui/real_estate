import type { Metadata } from 'next';
import { EditListing } from '@/components/EditListing';

export const metadata: Metadata = {
  title: 'Edit listing',
  robots: { index: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  return <EditListing id={id} />;
}
