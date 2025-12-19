/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bluetooth,
  ShieldCheck,
  Signal,
} from "lucide-react";
import EmergencyRouteMap from "./EmergencyRouteMap";
import VoiceWave from "./VoiceWave";
import VideoCallPanel from "./VideoCallPanel";
import { useRealtimeVoice } from "./useRealtimeVoice";

type Stage = "searching" | "dispatch" | "video";

export default function EmergencyCallScreen() {
  const [stage, setStage] = useState<Stage>("searching");
  const [countdown, setCountdown] = useState(9);

  const questions = useMemo(
    () => ({
      searching: "Who is the Patient?",
      dispatch: "Are you bleeding?",
      video: "Stay calm. Doctor is with you.",
    }),
    []
  );

  useEffect(() => {
    const timerA = window.setTimeout(() => setStage("dispatch"), 4500);
    const timerB = window.setTimeout(() => setStage("video"), 10500);
    return () => {
      window.clearTimeout(timerA);
      window.clearTimeout(timerB);
    };
  }, []);

  useEffect(() => {
    if (stage === "video") {
      setCountdown(0);
      return;
    }
    setCountdown(9);
    const interval = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [stage]);

  const voiceActive = stage !== "video";
  const { audioLevel, audioRef, status } = useRealtimeVoice(voiceActive);

  return (
    <main className="min-h-screen bg-[#06070f] px-4 py-8 text-white">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-6 pb-10">
        <EmergencyRouteMap stage={stage} />

        {stage === "video" ? (
          <VideoCallPanel
            active
            onHangup={() => {
              setStage("searching");
            }}
          />
        ) : (
          <section className="flex flex-col items-center gap-5 rounded-[28px] border border-white/10 bg-[#0e1120] px-6 py-8 text-center shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              AI triage live • {status === "ready" ? "listening" : status}
            </div>
            <h2 className="text-2xl font-semibold">{questions[stage]}</h2>
            <p className="text-sm text-white/60">
              Your voice is secure. You can answer naturally while we connect
              you to a doctor.
            </p>
            <VoiceWave level={audioLevel} />
            <audio ref={audioRef} className="hidden" />
          </section>
        )}

        <section className="rounded-[22px] border border-white/10 bg-[#10131f] px-5 py-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              Connecting to doctor...
            </div>
            <span className="font-semibold text-white">{`00:${String(
              countdown
            ).padStart(2, "0")}`}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#2a57ff] via-[#56c2ff] to-[#7c3aed]"
              style={{ width: `${Math.max(10, 100 - countdown * 10)}%` }}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-2">
              <Signal className="h-4 w-4" />
              5G Network
            </div>
            <div className="flex items-center gap-2">
              <Bluetooth className="h-4 w-4" />
              Headset Ready
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
