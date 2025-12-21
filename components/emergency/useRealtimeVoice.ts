/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_MODEL =
  process.env.NEXT_PUBLIC_REALTIME_MODEL || "gpt-realtime-mini";
const DEFAULT_VOICE = process.env.NEXT_PUBLIC_REALTIME_VOICE || "verse";

type RealtimeStatus = "idle" | "connecting" | "ready" | "error";

const buildEventId = () =>
  (globalThis.crypto?.randomUUID?.() ||
    `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function useRealtimeVoice(active: boolean) {
  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analysisFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopAnalysis = useCallback(() => {
    if (analysisFrameRef.current) {
      cancelAnimationFrame(analysisFrameRef.current);
      analysisFrameRef.current = null;
    }
    analyserRef.current = null;
    audioContextRef.current?.close?.();
    audioContextRef.current = null;
  }, []);

  const startAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx =
        typeof window !== "undefined"
          ? (window.AudioContext ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).webkitAudioContext)
          : undefined;
      if (!AudioCtx) return;
      audioContextRef.current = new AudioCtx();
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        setAudioLevel(rms);
        analysisFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // ignore audio analysis failure
    }
  }, []);

  const disconnect = useCallback(() => {
    dcRef.current?.close();
    dcRef.current = null;

    pcRef.current?.getSenders?.().forEach((sender) => sender.track?.stop?.());
    pcRef.current?.close();
    pcRef.current = null;

    micStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    micStreamRef.current = null;

    stopAnalysis();
    setAudioLevel(0);
    setStatus("idle");
  }, [stopAnalysis]);

  const connect = useCallback(async () => {
    if (pcRef.current || status === "connecting" || status === "ready") return;
    setStatus("connecting");
    setError(null);
    let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      setError("Timed out connecting. Check mic permissions or end other calls.");
      setStatus("error");
      disconnect();
    }, 8000);

    try {
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (stream && audioRef.current) {
          audioRef.current.srcObject = stream;
          audioRef.current.play().catch(() => undefined);
        }
      };

      const micStream = await navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .catch((err) => {
          const msg =
            err?.name === "NotReadableError"
              ? "Microphone is in use by another app/call."
              : err?.message || "Microphone unavailable.";
          throw new Error(msg);
        });
      micStreamRef.current = micStream;
      micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));
      startAnalysis(micStream);

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.onopen = () => {
        const promptEvent = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "You are an emergency triage assistant. Speak calmly and ask short questions to assess the patient.",
              },
            ],
          },
          event_id: buildEventId(),
        };
        const responseEvent = {
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            voice: DEFAULT_VOICE,
          },
          event_id: buildEventId(),
        };
        try {
          dc.send(JSON.stringify(promptEvent));
          dc.send(JSON.stringify(responseEvent));
        } catch {
          // ignore
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        const onState = () => {
          if (pc.iceGatheringState === "complete") {
            pc.removeEventListener("icegatheringstatechange", onState);
            resolve();
          }
        };
        pc.addEventListener("icegatheringstatechange", onState);
        setTimeout(() => {
          pc.removeEventListener("icegatheringstatechange", onState);
          resolve();
        }, 1500);
      });

      const sessionRes = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: pc.localDescription?.sdp || offer.sdp,
          model: DEFAULT_MODEL,
        }),
      });
      if (!sessionRes.ok) {
        throw new Error("Realtime session negotiation failed");
      }
      const answerSdp = await sessionRes.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      setStatus("ready");
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    } catch (err: any) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      disconnect();
      setError(err?.message || "Realtime voice connection failed");
      setStatus("error");
    }
  }, [disconnect, startAnalysis, status]);

  useEffect(() => {
    if (active) {
      connect();
      return;
    }
    disconnect();
  }, [active, connect, disconnect]);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    status,
    error,
    audioLevel,
    audioRef,
  };
}
