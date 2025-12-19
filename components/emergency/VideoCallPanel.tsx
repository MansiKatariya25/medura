"use client";

import { useEffect, useRef } from "react";
import { MessageCircle, Mic, PhoneOff, Video } from "lucide-react";
import { useLoopbackCall } from "./useLoopbackCall";

export default function VideoCallPanel({
  active,
  onHangup,
}: {
  active: boolean;
  onHangup?: () => void;
}) {
  const { localStream, remoteStream, status } = useLoopbackCall(active);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  return (
    <div className="rounded-[26px] border border-white/10 bg-[#0f111b] p-3 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
      <div className="relative overflow-hidden rounded-[22px] bg-[#15182a]">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          muted
          className="h-[280px] w-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#1b1f35] to-[#0f111b] text-sm text-white/70">
            {status === "connecting" ? "Connecting to doctor..." : "Waiting for doctor"}
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white">
          Connected to Dr. Mukesh Jain
        </div>
        <div className="absolute right-3 top-3 h-16 w-16 overflow-hidden rounded-2xl border border-white/20 bg-black/30">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-around text-white">
        <button className="rounded-full border border-white/15 bg-white/5 p-3">
          <Mic className="h-5 w-5" />
        </button>
        <button className="rounded-full border border-white/15 bg-white/5 p-3">
          <Video className="h-5 w-5" />
        </button>
        <button
          className="rounded-full border border-white/20 bg-[#ef4444] p-3"
          onClick={onHangup}
        >
          <PhoneOff className="h-5 w-5" />
        </button>
        <button className="rounded-full border border-white/15 bg-white/5 p-3">
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
