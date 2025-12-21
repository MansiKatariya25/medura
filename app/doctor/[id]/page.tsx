"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { doctors } from "@/data/doctors";
import { HeartPulse, X } from "lucide-react";

export default function DoctorPage() {
  const router = useRouter();
  const params = useParams();
  const idRaw = params?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  const doctor = id ? doctors.find((d) => d.id === id) : undefined;
  const { data: session } = useSession();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [callState, setCallState] = useState<"idle" | "incoming" | "active">("idle");
  const [callRoom, setCallRoom] = useState<string | null>(null);
  const [caller, setCaller] = useState<{ name?: string | null }>({});
  const socketRef = useRef<Socket | null>(null);

  if (!doctor) return <div className="p-6 text-white">Doctor not found</div>;

  const today = new Date();
  const week = useMemo(() =>
    Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const slotsByDay = useMemo(() => {
    const base = ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"];
    return week.map((_, i) => {
      // vary availability slightly by day for demo
      if (i % 3 === 0) return base;
      if (i % 3 === 1) return base.slice(0, 3);
      return base.slice(1);
    });
  }, [week]);

  const handleReserve = async () => {
    if (!selectedSlot) return setMessage("Please select a slot");
    setIsSubmitting(true);
    setMessage(null);
    try {
      const buildDateTime = (d: Date, slotStr: string) => {
        // slotStr like "01:00 PM"
        const parts = slotStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!parts) return d.toISOString();
        let hh = parseInt(parts[1], 10);
        const mm = parseInt(parts[2], 10);
        const ampm = parts[3].toUpperCase();
        if (ampm === "PM" && hh !== 12) hh += 12;
        if (ampm === "AM" && hh === 12) hh = 0;
        const dt = new Date(d);
        dt.setHours(hh, mm, 0, 0);
        return dt.toISOString();
      };

      const dateIso = buildDateTime(week[selectedDayIndex], selectedSlot);

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId: doctor.id, slot: selectedSlot, date: dateIso }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to reserve");
      setMessage("Appointment reserved");
      // navigate back or to confirmation
      setTimeout(() => router.push("/"), 900);
    } catch (err: any) {
      setMessage(err.message ?? "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      socket.emit("identify-user", {
        userId: session?.user?.id || null,
        userName: session?.user?.name || doctor.name,
        role: session?.user ? (session.user as any).role || "doctor" : "doctor",
      });
    });
    socket.on("call:incoming", (payload: any) => {
      setCallState("incoming");
      setCallRoom(payload.roomName);
      setCaller({ name: payload.callerName });
    });
    socket.on("call:ended", () => {
      setCallState("idle");
      setCallRoom(null);
      setCaller({});
    });
    socket.on("call:declined", () => {
      setCallState("idle");
      setCallRoom(null);
      setCaller({});
    });
    socket.on("call:answered", () => {
      setCallState("active");
    });
    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id, session?.user?.name, doctor.name]);

  const acceptCall = () => {
    if (!socketRef.current || !callRoom) return;
    socketRef.current.emit("call:answer", {
      toUserId: null,
      roomName: callRoom,
    });
    setCallState("active");
  };

  const declineCall = () => {
    if (!socketRef.current || !callRoom) return;
    socketRef.current.emit("call:decline", {
      toUserId: null,
      roomName: callRoom,
    });
    setCallState("idle");
    setCallRoom(null);
  };

  const endCall = () => {
    if (socketRef.current && callRoom) {
      socketRef.current.emit("call:end", { toUserId: null, roomName: callRoom });
    }
    setCallState("idle");
    setCallRoom(null);
  };

  return (
    <>
      <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-2xl pb-32">
          <div className="flex items-center gap-3">
            <button
              className="rounded-full border border-white/20 bg-white/5 p-3 text-white/70"
              onClick={() => router.back()}
            >
              ←
            </button>
            <h1 className="flex-1 text-center text-lg font-semibold">Doctors Details</h1>
            <div className="w-10" />
          </div>

          <div className="mt-4 rounded-lg border-2 border-[#2b6cff] p-4">
            <div className="relative h-44 w-full overflow-hidden rounded-lg">
              <Image src={doctor.image} alt={doctor.name} fill sizes="(max-width: 1024px) 100vw, 400px" className="object-cover rounded-lg" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold">{doctor.name}</p>
                <p className="text-sm text-white/60">{doctor.specialty}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[#0b1220] px-3 py-2">
                <HeartPulse className="h-5 w-5 text-white" />
                <div className="text-sm">{doctor.reviews ?? ""}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-[#0f1116] p-4">
            <h2 className="mb-2 text-sm font-semibold">About</h2>
            <p className="text-sm text-white/60">{doctor.description}</p>
          </div>

          <div className="mt-6 rounded-lg bg-[#0f1116] p-4">
            <h2 className="mb-3 text-sm font-semibold">Available Slots</h2>
            <div className="flex gap-2 overflow-x-auto pb-3">
              {week.map((d, idx) => {
                const dayShort = d.toLocaleDateString(undefined, { weekday: "short" });
                const dayNum = d.getDate();
                const isSelected = idx === selectedDayIndex;
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex h-10 w-10 flex-col items-center justify-center rounded-full border ${isSelected ? 'bg-[#0b5cff] text-white' : 'bg-transparent text-white/60'}`}
                  >
                    <span className="text-[10px] leading-none">{dayShort.slice(0,2)}</span>
                    <span className="text-sm font-semibold -mt-0.5">{dayNum}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-2">
              <div className="mb-2 text-sm text-white/70">
                {week[selectedDayIndex].toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-2">
                {(slotsByDay[selectedDayIndex] ?? []).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSlot(s)}
                    className={`w-full rounded-lg border px-4 py-3 text-left ${selectedSlot === s ? 'bg-[#0b5cff] text-white' : 'bg-transparent text-white/80'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="fixed bottom-6 left-1/2 z-30 w-[90%] max-w-2xl -translate-x-1/2">
            <button
              onClick={handleReserve}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#0b5cff] py-4 text-sm font-semibold"
            >
              {isSubmitting ? 'Reserving...' : 'Reserve an Appointment'}
            </button>
            {message ? <p className="mt-2 text-center text-sm text-white/80">{message}</p> : null}
          </div>
        </div>
      </div>

      {callState === "incoming" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f1116] p-5 text-white">
            <h3 className="text-lg font-semibold">Incoming call</h3>
            <p className="mt-2 text-sm text-white/70">
              {caller.name || "Caller"}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={declineCall}
                className="flex-1 rounded-full border border-white/15 bg-white/5 py-2 text-sm text-white hover:bg-white/10"
              >
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 rounded-full bg-[#4D7CFF] py-2 text-sm font-semibold text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {callState === "active" && callRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl space-y-3 rounded-2xl bg-[#0f1116] p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">In call</p>
                <p className="text-lg font-semibold">{caller.name || "Patient"}</p>
              </div>
              <button
                onClick={endCall}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white"
              >
                End
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <iframe
                title="Call"
                src={`https://meet.jit.si/${callRoom}`}
                className="h-[420px] w-full bg-black"
                allow="camera; microphone; fullscreen; display-capture"
              />
            </div>
            <button
              onClick={() => setCallState("active")}
              className="absolute right-3 top-3 text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
