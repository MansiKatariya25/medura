"use client";

export default function HomeDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-10 text-white lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-28">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
            </div>
            <div className="h-12 w-12 rounded-full border border-white/10 bg-white/5 animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex w-full items-center gap-2 rounded-full border border-white/30 p-1 text-sm text-white/60">
              <div className="flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm whitespace-nowrap">
                <div className="h-5 w-5 rounded-full bg-white/5" />
                <div className="h-3 w-20 rounded bg-white/10" />
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm text-white/60">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="h-5 w-px rounded-full bg-white/30" />
                  <div className="h-3 w-12 rounded bg-white/10" />
                </div>
                <div className="h-9 w-9 rounded-full bg-white/10" />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-3 w-16 rounded bg-white/10" />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-chip-${index}`}
                className="h-8 w-24 rounded-4xl bg-white/10 animate-pulse"
              />
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-hero-${index}`}
              className="rounded-[32px] bg-white/5 p-3 pb-4 animate-pulse"
            >
              <div className="h-40 rounded-[26px] bg-white/20" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/20" />
                <div className="h-3 w-1/2 rounded bg-white/20" />
                <div className="mt-2 flex gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-white/10" />
                  <div className="h-9 w-9 rounded-2xl bg-white/10" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 rounded-[36px] bg-white/5 p-5 animate-pulse">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="h-28 w-28 rounded-[28px] bg-white/20" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 rounded bg-white/20" />
                <div className="h-3 w-1/3 rounded bg-white/20" />
                <div className="h-3 w-1/4 rounded bg-white/20" />
                <div className="h-3 w-full rounded bg-white/10" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <div className="flex-1 h-10 rounded-2xl bg-white/10" />
              <div className="h-12 w-12 rounded-2xl bg-white/10" />
            </div>
          </div>
          <div className="flex-1 space-y-4 rounded-[36px] bg-white/5 p-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`skeleton-list-${idx}`}
                className="flex gap-4 rounded-[32px] bg-white/10 p-4"
              >
                <div className="h-24 w-24 rounded-[24px] bg-white/20" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 rounded bg-white/20" />
                  <div className="h-3 w-1/2 rounded bg-white/20" />
                  <div className="h-3 w-full rounded bg-white/10" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-9 w-20 rounded-2xl bg-white/10" />
                    <div className="h-9 w-20 rounded-2xl bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <nav className="fixed bottom-6 left-1/2 z-20 w-[90%] max-w-[420px] -translate-x-1/2 rounded-full bg-[#151621] px-6 py-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.4)] lg:max-w-lg">
        <div className="flex items-center justify-between">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={`skeleton-nav-${index}`}
              className="h-12 w-12 rounded-full bg-white/10"
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
