"use client";

import { Mic } from "lucide-react";

export default function VoiceWave({ level = 0 }: { level?: number }) {
  const bars = Array.from({ length: 18 }, (_, idx) => idx);
  const intensity = Math.min(1, Math.max(0.15, level * 8));

  return (
    <div className="relative flex flex-col items-center gap-3">
      <p className="text-sm text-white/70">Speak to Answer...</p>
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-[#2a57ff]/20 blur-2xl" />
        <div className="absolute h-14 w-14 rounded-full bg-[#2a57ff]/40 blur-xl" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#56c2ff] to-[#2a57ff] shadow-[0_12px_25px_rgba(46,116,218,0.45)]">
          <Mic className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="flex h-10 items-end gap-1">
        {bars.map((idx) => (
          <span
            key={idx}
            className="emergency-eq-bar"
            style={{
              animationDelay: `${idx * 0.08}s`,
              height: `${18 + intensity * 22}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
