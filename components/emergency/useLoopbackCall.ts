/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import SimplePeer, { Instance as SimplePeerInstance } from "simple-peer";

type CallStatus = "idle" | "connecting" | "connected" | "error";

export function useLoopbackCall(active: boolean) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerARef = useRef<SimplePeerInstance | null>(null);
  const peerBRef = useRef<SimplePeerInstance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("idle");
      setError(null);
      setRemoteStream(null);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      peerARef.current?.destroy();
      peerBRef.current?.destroy();
      peerARef.current = null;
      peerBRef.current = null;
      return;
    }

    let mounted = true;
    const start = async () => {
      try {
        setStatus("connecting");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) return;
        setLocalStream(stream);
        localStreamRef.current = stream;

        const peerA = new SimplePeer({ initiator: true, trickle: false, stream });
        const peerB = new SimplePeer({ initiator: false, trickle: false, stream });
        peerARef.current = peerA;
        peerBRef.current = peerB;

        peerA.on("signal", (data) => peerB.signal(data));
        peerB.on("signal", (data) => peerA.signal(data));

        peerB.on("stream", (incoming) => {
          if (!mounted) return;
          setRemoteStream(incoming);
          setStatus("connected");
        });

        peerA.on("error", (err) => {
          if (!mounted) return;
          setError(err.message);
          setStatus("error");
        });

        peerB.on("error", (err) => {
          if (!mounted) return;
          setError(err.message);
          setStatus("error");
        });
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || "Failed to start video call");
        setStatus("error");
      }
    };

    start();

    return () => {
      mounted = false;
      peerARef.current?.destroy();
      peerBRef.current?.destroy();
      peerARef.current = null;
      peerBRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    };
  }, [active]);

  return { status, error, localStream, remoteStream };
}
