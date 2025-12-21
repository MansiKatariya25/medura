"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

type Appointment = {
  _id?: string;
  id?: string;
  appointmentDate?: string;
  createdAt?: string;
};

const NOTIFICATION_KEY = "medura:notifications";
const REMINDER_KEY = "medura:appointment-reminders";
const JOINED_KEY = "medura:joined-communities";

const readNotifications = () => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(NOTIFICATION_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as NotificationItem[];
  } catch {
    return [];
  }
};

const writeNotifications = (items: NotificationItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("medura:notifications-update"));
};

export default function NotificationListener() {
  const { data: session } = useSession();
  const [joinedCommunityIds, setJoinedCommunityIds] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(JOINED_KEY);
    if (raw) {
      try {
        setJoinedCommunityIds(JSON.parse(raw) as string[]);
      } catch {
        setJoinedCommunityIds([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch("/api/user/communities");
        if (!res.ok) return;
        const data = await res.json();
        const ids = (data?.communityIds || []).map((v: string) => String(v));
        if (!ids.length) return;
        setJoinedCommunityIds((prev) =>
          Array.from(new Set([...prev, ...ids])),
        );
        if (typeof window !== "undefined") {
          window.localStorage.setItem(JOINED_KEY, JSON.stringify(ids));
        }
      } catch {
        // ignore
      }
    })();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!joinedCommunityIds.length) return;
    if (typeof window === "undefined") return;
    const url =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${
        window.location.host
      }/ws/community`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          type: "identify",
          userId: session?.user?.id || "anon",
          userName: session?.user?.name || "You",
        }),
      );
      joinedCommunityIds.forEach((groupId) => {
        ws.send(
          JSON.stringify({
            type: "join",
            groupId,
          }),
        );
      });
    });
    ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          groupId?: string;
          from?: string;
          text?: string;
          messageId?: string;
          time?: number;
        };
        if (payload.type !== "message") return;
        if (!payload.groupId || !joinedCommunityIds.includes(payload.groupId)) return;
        if (payload.from && payload.from === session?.user?.name) return;
        const notifId = payload.messageId || `msg-${payload.groupId}-${payload.time}`;
        const existing = readNotifications();
        if (existing.some((n) => n.id === notifId)) return;
        const timeLabel = payload.time
          ? new Date(payload.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Now";
        const next = [
          {
            id: notifId,
            title: "Community message",
            body: `${payload.from || "Member"}: ${payload.text || ""}`,
            time: timeLabel,
            read: false,
          },
          ...existing,
        ].slice(0, 50);
        writeNotifications(next);
      } catch {
        // ignore
      }
    });
    ws.addEventListener("close", () => {
      wsRef.current = null;
    });
    return () => ws.close();
  }, [joinedCommunityIds, session?.user?.id, session?.user?.name]);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch("/api/appointments");
        if (!res.ok) return;
        const data = await res.json();
        const appointments = (data?.appointments || []) as Appointment[];
        if (!appointments.length) return;
        const raw = typeof window !== "undefined"
          ? window.localStorage.getItem(REMINDER_KEY)
          : null;
        const sent = new Set<string>();
        if (raw) {
          try {
            (JSON.parse(raw) as string[]).forEach((id) => sent.add(id));
          } catch {
            // ignore
          }
        }
        const now = Date.now();
        const updates: NotificationItem[] = [];
        const nextSent = new Set(sent);
        appointments.forEach((appt) => {
          if (!appt.appointmentDate) return;
          const apptDate = new Date(appt.appointmentDate);
          if (Number.isNaN(apptDate.getTime())) return;
          const diffDays = (apptDate.getTime() - now) / (1000 * 60 * 60 * 24);
          if (diffDays < 2 || diffDays > 3) return;
          const apptId = String(appt._id || appt.id || appt.appointmentDate);
          const reminderId = `appt-${apptId}`;
          if (nextSent.has(reminderId)) return;
          nextSent.add(reminderId);
          updates.push({
            id: reminderId,
            title: "Appointment reminder",
            body: `Upcoming appointment on ${apptDate.toLocaleString()}.`,
            time: "Upcoming",
            read: false,
          });
        });
        if (updates.length) {
          const existing = readNotifications();
          const next = [...updates, ...existing].slice(0, 50);
          writeNotifications(next);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              REMINDER_KEY,
              JSON.stringify(Array.from(nextSent)),
            );
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [session?.user?.id]);

  return null;
}
