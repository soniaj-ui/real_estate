// Grey boxes in the shape of the listing cards, so the page doesn't jump when results arrive.
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto grid w-full max-w-6xl gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((box) => (
        <div key={box} className="h-72 rounded-2xl bg-gray-200 motion-safe:animate-pulse" />
      ))}
    </div>
  );
}
