"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, MapPin, PhoneCall, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type AmbulanceStats = {
  activeRequests: number;
  completedToday: number;
  avgResponse: string;
  status: "available" | "on-call";
};

export default function AmbulanceDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stats] = useState<AmbulanceStats>({
    activeRequests: 2,
    completedToday: 6,
    avgResponse: "7 min",
    status: "available",
  });

  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as any)?.role;
    if (role !== "ambulance") {
      router.replace("/auth/ambulance");
    }
  }, [router, session?.user, status]);

  const badges = useMemo(
    () => [
      { label: "Active requests", value: stats.activeRequests },
      { label: "Completed today", value: stats.completedToday },
      { label: "Avg. response", value: stats.avgResponse },
    ],
    [stats],
  );

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-28">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Activity className="h-6 w-6 text-white/80" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Ambulance Dashboard</h1>
              <p className="text-sm text-white/60">
                {session?.user?.name ? `Welcome back, ${session.user.name}` : "Welcome back"}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Status: {stats.status === "available" ? "Available" : "On Call"}
          </span>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {badges.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#0f1116] p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/40">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#11121A] px-4 py-3 text-sm text-white/80">
              <PhoneCall className="h-4 w-4 text-[#4D7CFF]" />
              Respond to SOS
            </button>
            <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#11121A] px-4 py-3 text-sm text-white/80">
              <MapPin className="h-4 w-4 text-[#4D7CFF]" />
              Update location
            </button>
            <button className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#11121A] px-4 py-3 text-sm text-white/80">
              <Timer className="h-4 w-4 text-[#4D7CFF]" />
              Response history
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
