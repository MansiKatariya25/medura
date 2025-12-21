"use client";

import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import {
  createLocalTracks,
  Room,
  RoomEvent,
  Track,
  type LocalTrack,
} from "livekit-client";
import { HeartPulse, X } from "lucide-react";
import type { Doctor } from "@/types/doctor";

export default function DoctorPage() {
  const router = useRouter();
  const params = useParams();
  const idRaw = params?.id;
  const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;
  const { data: session } = useSession();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [availability, setAvailability] = useState<string[]>([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [callState, setCallState] = useState<"idle" | "incoming" | "active">("idle");
  const [callRoom, setCallRoom] = useState<string | null>(null);
  const [caller, setCaller] = useState<{ id?: string | null; name?: string | null }>({});
  const socketRef = useRef<Socket | null>(null);
  const roomRef = useRef<Room | null>(null);
  const localTracksRef = useRef<LocalTrack[]>([]);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const isOwnDoctor =
    !!id && session?.user?.id === id && (session.user as any).role === "doctor";

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) return;
      setLoadingDoctor(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/doctors/${id}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Unable to load doctor");
        }
        if (!active) return;
        setDoctor(data.doctor);
        setAvailability(data.doctor?.availabilityDays || []);
      } catch (err: any) {
        if (!active) return;
        setLoadError(err?.message || "Failed to load doctor");
      } finally {
        if (active) setLoadingDoctor(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("medura:incoming-call");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        roomName?: string;
        callerId?: string | null;
        callerName?: string | null;
        accepted?: boolean;
      };
      if (!data?.roomName) return;
      setCallRoom(data.roomName);
      setCaller({ id: data.callerId || null, name: data.callerName || "Patient" });
      if (data.accepted) {
        setCallState("active");
        connectLiveKit(data.roomName || "");
      } else {
        setCallState("incoming");
      }
      window.sessionStorage.removeItem("medura:incoming-call");
    } catch {
      // ignore
    }
  }, []);

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
    if (!doctor) return setMessage("Doctor unavailable");
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
        userName: session?.user?.name || doctor?.name || "Doctor",
        role: session?.user ? (session.user as any).role || "doctor" : "doctor",
      });
    });
    socket.on("call:incoming", (payload: any) => {
      setCallState("incoming");
      setCallRoom(payload.roomName);
      setCaller({ id: payload.callerId || null, name: payload.callerName });
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
    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id, session?.user?.name, doctor?.name]);

  useEffect(() => {
    if (!socketRef.current?.connected) return;
    if (!session?.user?.id) return;
    socketRef.current.emit("identify-user", {
      userId: session.user.id,
      userName: session.user.name || doctor?.name || "Doctor",
      role: (session.user as any)?.role || "doctor",
    });
  }, [session?.user?.id, session?.user?.name, doctor?.name]);

  const acceptCall = () => {
    if (!socketRef.current || !callRoom) return;
    socketRef.current.emit("call:answer", {
      toUserId: caller?.id || null,
      roomName: callRoom,
    });
    setCallState("active");
    connectLiveKit(callRoom);
  };

  const declineCall = () => {
    if (!socketRef.current || !callRoom) return;
    socketRef.current.emit("call:decline", {
      toUserId: caller?.id || null,
      roomName: callRoom,
    });
    cleanupCall();
  };

  const endCall = () => {
    if (socketRef.current && callRoom) {
      socketRef.current.emit("call:end", { toUserId: caller?.id || null, roomName: callRoom });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (localTracksRef.current.length) {
      localTracksRef.current.forEach((track) => track.stop());
      localTracksRef.current = [];
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setCallState("idle");
    setCallRoom(null);
  };

  const connectLiveKit = async (roomName: string) => {
    try {
      if (roomRef.current) return;
      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!wsUrl) throw new Error("LiveKit URL missing");
      const tokenRes = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenJson?.error || "Token error");

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
          track.attach(remoteVideoRef.current);
          remoteVideoRef.current.play().catch(() => undefined);
        }
        if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
          track.attach(remoteAudioRef.current);
          remoteAudioRef.current.play().catch(() => undefined);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach();
      });

      room.on(RoomEvent.Disconnected, () => {
        cleanupCall();
      });

      await room.connect(wsUrl, tokenJson.token, { autoSubscribe: true });

      const localTracks = await createLocalTracks({
        audio: true,
        video: true,
      });
      localTracksRef.current = localTracks;
      for (const t of localTracks) {
        await room.localParticipant.publishTrack(t);
      }
      const localVideo = localTracks.find((t) => t.kind === Track.Kind.Video);
      if (localVideo && localVideoRef.current) {
        localVideo.attach(localVideoRef.current);
        localVideoRef.current.play().catch(() => undefined);
      }
    } catch {
      cleanupCall();
    }
  };

  const toggleDay = (day: string) => {
    setAvailability((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const saveAvailability = async () => {
    if (!isOwnDoctor || !id) return;
    setSavingAvailability(true);
    try {
      const res = await fetch(`/api/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilityDays: availability }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setDoctor(data.doctor);
    } catch (err: any) {
      setMessage(err?.message || "Could not save availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  if (loadingDoctor) {
    return <div className="p-6 text-white">Loading doctor...</div>;
  }

  if (!doctor) {
    return (
      <div className="p-6 text-white">
        {loadError || "Doctor not found"}
      </div>
    );
  }

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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Availability</h2>
              {isOwnDoctor ? (
                <button
                  onClick={saveAvailability}
                  disabled={savingAvailability}
                  className="rounded-full bg-[#0b5cff] px-3 py-1 text-xs font-semibold text-white disabled:bg-white/20"
                >
                  {savingAvailability ? "Saving..." : "Save"}
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
                const active = availability.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => isOwnDoctor && toggleDay(day)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                      active
                        ? "border-[#0b5cff] bg-[#0b5cff]/20 text-white"
                        : "border-white/10 bg-transparent text-white/60"
                    } ${isOwnDoctor ? "hover:border-[#0b5cff]" : ""}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {!isOwnDoctor ? (
              <p className="mt-2 text-xs text-white/50">
                {availability.length === 0
                  ? "Doctor has not set availability yet."
                  : "Available on highlighted days."}
              </p>
            ) : (
              <p className="mt-2 text-xs text-white/50">
                Toggle the days you are available for video calls and appointments.
              </p>
            )}
            {Array.isArray(doctor.availabilitySlots) && doctor.availabilitySlots.length > 0 ? (
              <div className="mt-4 space-y-2 text-xs text-white/70">
                {doctor.availabilitySlots.map((slot, idx) => (
                  <div
                    key={`${slot.day}-${slot.start}-${slot.end}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <span className="font-semibold text-white">{slot.day}</span>
                    <span>
                      {slot.start} - {slot.end}
                      {slot.date ? ` • ${slot.date}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
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
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-[360px] w-full object-cover"
            />
            <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            </div>
            <audio ref={remoteAudioRef} autoPlay />
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
