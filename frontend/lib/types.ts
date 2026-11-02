export type PropertyType = 'apartment' | 'villa' | 'plot' | 'commercial';

export type User = {
  id: string;
  name: string;
  email: string;
};

export type PropertySummary = {
  id: string;
  slug: string;
  title: string;
  city: string;
  locality: string;
  type: PropertyType;
  price: number;
  bedrooms: number;
  created_at: string;
  coverImage: string | null;
};

export type PropertyImage = {
  id: string;
  url: string;
  position: number;
};

export type Property = Omit<PropertySummary, 'coverImage'> & {
  owner_id: string;
  description: string;
  status: 'active' | 'inactive';
  updated_at: string;
  images: PropertyImage[];
};

export type Page<T> = {
  items: T[];
  nextCursor: string | null;
};

export type Inquiry = {
  id: string;
  message: string;
  created_at: string;
  property_id: string;
  property_slug: string;
  property_title: string;
  sender_name?: string;
  sender_email?: string;
};
