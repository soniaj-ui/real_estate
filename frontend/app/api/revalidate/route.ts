import { revalidatePath } from 'next/cache';

// The API calls this after a listing changes, so its cached page gets rebuilt.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || request.headers.get('x-revalidate-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.slug !== 'string') {
    return Response.json({ error: 'slug is required' }, { status: 400 });
  }

  revalidatePath(`/properties/${body.slug}`);
  return Response.json({ revalidated: true });
}
