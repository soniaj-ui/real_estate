import Image from 'next/image';
import type { PropertyType } from '@/lib/types';

// How many photos each type has in public/samples.
const PHOTO_COUNTS: Record<PropertyType, number> = {
  apartment: 3,
  villa: 7,
  plot: 2,
  commercial: 4,
};

type Props = {
  id: string;
  type: PropertyType;
  sizes: string;
};

// Used when a listing has no photo. It's labelled, so nobody thinks it shows the real property.
export function SamplePhoto({ id, type, sizes }: Props) {
  // The listing's id picks the photo, so a listing always shows the same one.
  const number = (Number(id) % PHOTO_COUNTS[type]) + 1;

  return (
    <>
      <Image
        src={`/samples/${type}-${number}.jpg`}
        alt=""
        fill
        sizes={sizes}
        className="object-cover transition duration-300 motion-safe:group-hover:scale-105"
      />
      <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
        Sample photo
      </span>
    </>
  );
}
