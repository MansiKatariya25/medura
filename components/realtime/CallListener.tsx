"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { PhoneCall, PhoneOff, X } from "lucide-react";

type IncomingCall = {
  roomName: string;
  callerId?: string | null;
  callerName?: string | null;
  sdp?: string | null;
};

const STORAGE_KEY = "medura:incoming-call";

export default function CallListener() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [userRole, setUserRole] = useState<string | null>(
    session?.user ? ((session.user as any)?.role as string) ?? null : null,
  );
  const [callActive, setCallActive] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // fetch role if not present on session
    if (!session?.user && !userRole) return;
    const sUser = session?.user as any;
    const sessionRole =
      sUser && sUser.role ? String(sUser.role).toLowerCase() : null;
    if (sessionRole && sessionRole !== userRole) {
      setUserRole(sessionRole);
      return;
    }
    if (!userRole) {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data?.profile?.role) {
            setUserRole(String(data.profile.role).toLowerCase());
          }
        })
        .catch(() => undefined);
    } else {
      const sUser = session?.user as any;
      if (sUser?.role && String(sUser.role).toLowerCase() !== userRole) {
        setUserRole(String(sUser.role).toLowerCase());
      }
    }
  }, [session?.user, userRole]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const socket = io({
      path: "/socket.io",
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      if (!session?.user?.id) return;
      socket.emit("identify-user", {
        userId: session.user.id,
        userName: session.user.name || "User",
        role: (session.user as any)?.role || null,
      });
    });
    socket.on("call:incoming", (payload: any) => {
      const role = String(
        userRole || (session?.user as any)?.role || "",
      ).toLowerCase();
      // allow popup unless explicitly patient
      if (role === "patient") return;
      setIncoming((prev) => ({
        roomName: payload.roomName || prev?.roomName || "",
        callerId: payload.callerId || prev?.callerId || null,
        callerName: payload.callerName || prev?.callerName || "Patient",
        sdp: prev?.sdp || null,
      }));
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            roomName: payload.roomName,
            callerId: payload.callerId || null,
            callerName: payload.callerName || "Patient",
          }),
        );
      }
    });
    socket.on("call:offer", (payload: any) => {
      const role = String(
        userRole || (session?.user as any)?.role || "",
      ).toLowerCase();
      if (role === "patient") return;
      setIncoming((prev) => ({
        roomName: payload.roomName || prev?.roomName || "",
        callerId: payload.callerId || prev?.callerId || null,
        callerName: payload.callerName || prev?.callerName || "Patient",
        sdp: payload.sdp || prev?.sdp || null,
      }));
    });
    socket.on("call:ice", async (payload: any) => {
      if (!payload?.candidate) return;
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(payload.candidate);
      } catch {
        // ignore
      }
    });
    socket.on("call:ended", () => {
      cleanupCall();
    });
    socket.on("call:declined", () => {
      cleanupCall();
    });
    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id, session?.user?.name, userRole]);

  useEffect(() => {
    if (!socketRef.current?.connected) return;
    if (!session?.user?.id) return;
    socketRef.current.emit("identify-user", {
      userId: session.user.id,
      userName: session.user.name || "User",
      role: (session.user as any)?.role || null,
    });
  }, [session?.user?.id, session?.user?.name]);

  const handleAccept = async () => {
    if (!incoming || !socketRef.current) return;
    if (!incoming.sdp) {
      setCallError("Call offer missing. Please try again.");
      return;
    }
    try {
      setCallError(null);
      const pc = createPeerConnection(incoming.callerId || null);
      const stream = await startLocalStream();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription({ type: "offer", sdp: incoming.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current.emit("call:answer", {
        toUserId: incoming.callerId || null,
        roomName: incoming.roomName,
        sdp: answer.sdp,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...incoming, accepted: true }),
        );
      }
      setCallActive(true);
    } catch (err: any) {
      setCallError(err?.message || "Unable to connect call");
    }
  };

  const handleDecline = () => {
    if (!incoming || !socketRef.current) return;
    socketRef.current.emit("call:decline", {
      toUserId: incoming.callerId || null,
      roomName: incoming.roomName,
    });
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
    setIncoming(null);
  };

  const endCall = () => {
    if (socketRef.current && incoming?.roomName) {
      socketRef.current.emit("call:end", {
        toUserId: incoming.callerId || null,
        roomName: incoming.roomName,
      });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallActive(false);
    setIncoming(null);
  };

  const createPeerConnection = (targetUserId: string | null) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && incoming?.roomName) {
        socketRef.current.emit("call:ice", {
          toUserId: targetUserId,
          roomName: incoming.roomName,
          candidate: event.candidate,
        });
      }
    };
    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream && remoteVideoRef.current) {
        remoteStreamRef.current = stream;
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => undefined);
      }
    };
    pcRef.current = pc;
    return pc;
  };

  const startLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => undefined);
    }
    return stream;
  };

  if (!incoming && !callActive) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
      {!callActive ? (
        <div className="w-full max-w-sm rounded-2xl bg-[#0f1116] p-5 text-white">
          <h3 className="text-lg font-semibold">Incoming call</h3>
          <p className="mt-2 text-sm text-white/70">
            {incoming?.callerName || "Patient"}
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 rounded-full border border-white/15 bg-white/5 py-2 text-sm text-white hover:bg-white/10"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <PhoneOff className="h-4 w-4" />
                Decline
              </span>
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 rounded-full bg-[#4D7CFF] py-2 text-sm font-semibold text-white"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Accept
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-3xl rounded-2xl bg-[#0f1116] p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">In call</p>
              <p className="text-base font-semibold">
                {incoming?.callerName || "Patient"}
              </p>
            </div>
            <button
              onClick={endCall}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white"
            >
              End
            </button>
          </div>
          {callError ? (
            <p className="mt-2 text-xs text-red-400">{callError}</p>
          ) : null}
          <div className="relative mt-3 overflow-hidden rounded-xl border border-white/10 bg-black">
            <div className="relative h-[420px] w-full overflow-hidden rounded-xl bg-black">
              <video
                ref={remoteVideoRef}
                className="h-full w-full object-cover"
                playsInline
                autoPlay
              />
              <div className="absolute bottom-3 right-3 h-24 w-32 overflow-hidden rounded-lg border border-white/20 bg-black/80">
                <video
                  ref={localVideoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
              </div>
            </div>
            {callError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-red-400">
                {callError}
              </div>
            ) : null}
          </div>
          <button
            onClick={endCall}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 hover:text-white"
            aria-label="Close call"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
