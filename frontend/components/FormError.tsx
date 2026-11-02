import { ApiError } from '@/lib/client';

// Shows an API error, including which fields were wrong.
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;

  const message = error instanceof Error ? error.message : 'Something went wrong';
  const details = error instanceof ApiError ? error.details : [];

  return (
    <div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <p>{message}</p>
      {details.length > 0 && (
        <ul className="mt-1 list-inside list-disc">
          {details.map((detail) => (
            <li key={`${detail.path.join('.')}-${detail.message}`}>
              {detail.path.join('.')}: {detail.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
