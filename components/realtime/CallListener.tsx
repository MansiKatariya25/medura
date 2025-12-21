"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
// Dynamically import Zego inside connect to avoid SSR issues
import { PhoneCall, PhoneOff, X } from "lucide-react";

type IncomingCall = {
  roomName: string;
  callerId?: string | null;
  callerName?: string | null;
};

const STORAGE_KEY = "medura:incoming-call";

export default function CallListener() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const socketRef = useRef<Socket | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [userRole, setUserRole] = useState<string | null>(
    session?.user ? ((session.user as any)?.role as string) ?? null : null,
  );
  const [callActive, setCallActive] = useState(false);
  const zegoInstanceRef = useRef<any>(null);
  const zegoContainerRef = useRef<HTMLDivElement | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

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
      if (pathname.startsWith("/doctor/")) return;
      const next: IncomingCall = {
        roomName: payload.roomName,
        callerId: payload.callerId || null,
        callerName: payload.callerName || "Patient",
      };
      setIncoming(next);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [session?.user?.id, session?.user?.name, pathname, userRole]);

  useEffect(() => {
    if (!socketRef.current?.connected) return;
    if (!session?.user?.id) return;
    socketRef.current.emit("identify-user", {
      userId: session.user.id,
      userName: session.user.name || "User",
      role: (session.user as any)?.role || null,
    });
  }, [session?.user?.id, session?.user?.name]);

  const handleAccept = () => {
    if (!incoming || !socketRef.current) return;
    socketRef.current.emit("call:answer", {
      toUserId: incoming.callerId || null,
      roomName: incoming.roomName,
    });
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...incoming, accepted: true }),
      );
    }
    setCallActive(true);
    connectLiveKit(incoming.roomName || "");
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
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.destroy();
      zegoInstanceRef.current = null;
    }
    if (zegoContainerRef.current) {
      zegoContainerRef.current.innerHTML = "";
    }
    setCallActive(false);
    setIncoming(null);
  };

  const connectLiveKit = async (roomName: string) => {
    try {
      setCallError(null);
      if (!zegoContainerRef.current) return;
      const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
      const appId = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID || process.env.ZEGO_APP_ID);
      const serverSecret = process.env.ZEGO_SERVER_SECRET;
      if (!appId || !serverSecret) throw new Error("Zego not configured");
      const userId = (session?.user?.id as string) || `user-${Date.now()}`;
      const userName = session?.user?.name || "Doctor";
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appId,
        serverSecret,
        roomName,
        userId,
        userName,
      );
      const zp = ZegoUIKitPrebuilt.create(kitToken);
      zegoInstanceRef.current = zp;
      zp.joinRoom({
        container: zegoContainerRef.current,
        sharedLinks: [],
        showPreJoinView: false,
        turnOnCameraWhenJoining: true,
        turnOnMicrophoneWhenJoining: true,
        showLeavingView: false,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        onLeaveRoom: () => cleanupCall(),
      });
    } catch (err: any) {
      const msg = err?.message || "Unable to connect call";
      setCallError(msg);
      // keep overlay open so user can end manually
    }
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
            <div
              ref={zegoContainerRef}
              className="relative h-[420px] w-full overflow-hidden rounded-xl bg-black"
            />
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
