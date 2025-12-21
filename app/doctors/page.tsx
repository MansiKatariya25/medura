"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Calendar, Clock, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Appointment = {
  _id?: string;
  id?: string;
  doctorId?: string;
  appointmentDate?: string | null;
  createdAt?: string;
  status?: string;
  userName?: string | null;
  userEmail?: string | null;
  notes?: string | null;
  slot?: string | null;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

export default function DoctorDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as any)?.role;
    if (role && role !== "doctor") {
      router.replace("/home");
      return;
    }
  }, [router, session?.user, status]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/doctor/appointments");
        if (!res.ok) return;
        const data = await res.json();
        setAppointments(data?.appointments || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("medura:notifications");
    if (raw) {
      try {
        setNotifications(JSON.parse(raw) as NotificationItem[]);
        return;
      } catch {
        // ignore
      }
    }
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const raw = window.localStorage.getItem("medura:notifications");
      if (!raw) return;
      try {
        setNotifications(JSON.parse(raw) as NotificationItem[]);
      } catch {
        // ignore
      }
    };
    window.addEventListener("medura:notifications-update", handler);
    return () => window.removeEventListener("medura:notifications-update", handler);
  }, []);

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      appointments.filter((appt) => {
        if (!appt.appointmentDate) return false;
        const dt = new Date(appt.appointmentDate);
        return !Number.isNaN(dt.getTime()) && dt.getTime() >= now;
      }),
    [appointments, now],
  );
  const past = useMemo(
    () =>
      appointments.filter((appt) => {
        if (!appt.appointmentDate) return false;
        const dt = new Date(appt.appointmentDate);
        return !Number.isNaN(dt.getTime()) && dt.getTime() < now;
      }),
    [appointments, now],
  );

  const stats = [
    { label: "Total appointments", value: appointments.length },
    { label: "Upcoming", value: upcoming.length },
    { label: "Completed", value: past.length },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-28">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
              <Stethoscope className="h-6 w-6 text-white/80" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Doctor Dashboard</h1>
              <p className="text-sm text-white/60">
                {session?.user?.name ? `Welcome back, ${session.user.name}` : "Welcome back"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="relative rounded-full border border-white/20 bg-white/10 p-3 text-white/70"
              onClick={() => router.push("/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-[#0f1116] p-4"
            >
              <p className="text-xs uppercase tracking-wide text-white/40">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Upcoming appointments</h2>
              <p className="text-sm text-white/50">
                Patients scheduled in the next few days
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <Calendar className="h-4 w-4" />
              <span>{upcoming.length} upcoming</span>
            </div>
          </div>

          {loading ? (
            <div className="mt-4 text-sm text-white/60">Loading...</div>
          ) : upcoming.length === 0 ? (
            <div className="mt-4 text-sm text-white/60">No upcoming appointments.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {upcoming.slice(0, 6).map((appt) => {
                const dt = appt.appointmentDate
                  ? new Date(appt.appointmentDate)
                  : null;
                const timeLabel = dt ? dt.toLocaleString() : appt.slot || "Scheduled";
                return (
                  <div
                    key={appt._id || appt.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#11121A] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {appt.userName || "Patient"}
                      </p>
                      <p className="text-xs text-white/50">
                        {appt.userEmail || "No email provided"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Clock className="h-4 w-4" />
                      <span>{timeLabel}</span>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wide text-white/60">
                      {appt.status || "booked"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent history</h2>
            <span className="text-xs text-white/50">{past.length} completed</span>
          </div>
          {loading ? (
            <div className="mt-4 text-sm text-white/60">Loading...</div>
          ) : past.length === 0 ? (
            <div className="mt-4 text-sm text-white/60">No completed appointments yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {past.slice(0, 4).map((appt) => {
                const dt = appt.appointmentDate
                  ? new Date(appt.appointmentDate)
                  : null;
                return (
                  <div
                    key={appt._id || appt.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#11121A] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {appt.userName || "Patient"}
                      </p>
                      <p className="text-xs text-white/50">
                        {dt ? dt.toLocaleString() : "Date pending"}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wide text-white/50">
                      {appt.status || "completed"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
