export default function Loading() {
  return (
    <div className="flex flex-col min-h-dvh bg-zinc-50 dark:bg-black font-sans relative overflow-hidden pb-24">
      <main className="flex-1 w-full max-w-md p-4 mx-auto sm:p-6 lg:max-w-lg">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>

        <div className="flex flex-col gap-6">
          {/* Skeleton Word Banner */}
          <div className="flex flex-col items-center justify-center p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm text-center relative overflow-hidden min-h-[180px]">
            <div className="flex items-center justify-center"></div>
            <div className="mt-4 h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>

          {/* Skeleton Definitions Section */}
          <div className="flex flex-col gap-4">
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded px-2 animate-pulse mb-2" />

            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col gap-2 min-h-[100px]"
              >
                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mt-2" />
                <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
