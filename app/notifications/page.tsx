"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const seedNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Community update",
    body: "Heart Care Circle posted a new session for Saturday.",
    time: "2m ago",
    read: false,
  },
  {
    id: "notif-2",
    title: "MedKey synced",
    body: "Your health records were successfully synced.",
    time: "1h ago",
    read: false,
  },
  {
    id: "notif-3",
    title: "Doctor availability",
    body: "Dr. Anurag is available for video consults.",
    time: "Yesterday",
    read: true,
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("medura:notifications");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as NotificationItem[];
        setNotifications(parsed);
        return;
      } catch {
        // ignore
      }
    }
    setNotifications(seedNotifications);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "medura:notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);

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

  useEffect(() => {
    if (!notifications.length) return;
    setNotifications((prev) =>
      prev.map((notif) => (notif.read ? notif : { ...notif, read: true })),
    );
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/80">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Notifications</h1>
              <p className="text-sm text-white/50">
                {unreadCount} new updates
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
              You&apos;re all caught up.
            </div>
          ) : (
            notifications.map((notif) => (
              <article
                key={notif.id}
                className="rounded-2xl border border-white/10 bg-[#0f1116] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold">{notif.title}</h2>
                    <p className="mt-1 text-sm text-white/60">{notif.body}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60">
                    {notif.time}
                  </span>
                </div>
                {!notif.read ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    New
                  </div>
                ) : null}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
