export function MarketCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-3 w-32" />
        </div>
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="skeleton h-7 w-28" />
      <div className="skeleton h-12 w-full" />
    </div>
  );
}
