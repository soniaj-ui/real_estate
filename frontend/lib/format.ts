import type { PropertyType } from './types';

const CRORE = 10000000;
const LAKH = 100000;

// Rounds down, so a price is never shown as higher than it is.
function shorten(value: number): number {
  return Math.floor(value * 100) / 100;
}

export function formatPrice(price: number): string {
  if (price >= CRORE) return `₹${shorten(price / CRORE)} Cr`;
  if (price >= LAKH) return `₹${shorten(price / LAKH)} Lakh`;
  return formatFullPrice(price);
}

export function formatFullPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`;
}

// Plots and commercial property don't have bedrooms, so they get no label.
export function formatBedrooms(bedrooms: number, type: PropertyType): string | null {
  if (type === 'plot' || type === 'commercial' || bedrooms === 0) return null;
  return bedrooms === 1 ? '1 bedroom' : `${bedrooms} bedrooms`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
