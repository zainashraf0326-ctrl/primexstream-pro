export function PageLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-28 pt-6">
      <div className="h-7 w-44 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/80" />
      <div className="h-24 w-full animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
      </div>
      <div className="h-40 w-full animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
    </div>
  );
}
