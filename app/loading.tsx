export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="w-full h-80 rounded-2xl bg-zinc-900/60 border border-zinc-800/80" />

      {/* Grid skeleton */}
      <div className="space-y-4">
        <div className="w-48 h-6 bg-zinc-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="aspect-[2/3] bg-zinc-900 rounded-xl border border-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
