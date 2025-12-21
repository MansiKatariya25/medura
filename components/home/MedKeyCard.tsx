"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Fingerprint, Share2, Copy, CheckCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function MedKeyCard() {
  const { data: session } = useSession();
  const [isFlipped, setIsFlipped] = useState(false);
  const [meduraId, setMeduraId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState(true);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");

  const user = {
    name: session?.user?.name || "Medura User",
    id: session?.user?.id || "user",
    medura: meduraId ?? "Generating...",
    bloodGroup: session?.user?.medKey?.bloodGroup || "Unknown",
  };

  useEffect(() => {
    let active = true;
    const fetchMeduraId = async () => {
      setLoadingId(true);
      try {
        const res = await fetch("/api/medkey", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load Medura ID");
        if (active) setMeduraId(data.meduraId);
      } catch {
        if (active) setMeduraId(null);
      } finally {
        if (active) setLoadingId(false);
      }
    };
    fetchMeduraId();
    return () => {
      active = false;
    };
  }, []);

  const qrData = JSON.stringify({
    uid: user.id,
    medura: user.medura,
    bg: user.bloodGroup,
    action: "MEDURA_EMERGENCY_ACCESS",
  });

  const handleFlip = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
    setIsFlipped((prev) => !prev);
  };

  const handleCopy = () => {
    if (!meduraId) return;
    navigator.clipboard.writeText(meduraId).then(() => {
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1500);
    });
  };

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="perspective-1000 relative aspect-[4/3] w-full">
        <motion.div
          className="relative h-full w-full cursor-pointer transition-all duration-500 will-change-transform"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: "preserve-3d" }}
          onClick={handleFlip}
        >
          {/* FRONT FACE */}
          <div className="absolute inset-0 h-full w-full backface-hidden">
            <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/20 bg-gradient-to-br from-blue-600 via-indigo-600 to-orange-500 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="absolute inset-0 -skew-x-12 translate-x-[-150%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="flex h-full flex-col justify-between text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-md">
                      <div className="h-3 w-3 rounded-sm bg-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white drop-shadow-md">
                      Medura
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                        Medura ID
                      </div>
                      <div className="text-[9px] font-medium leading-none text-white/60">
                        Verified
                      </div>
                    </div>
                    <Fingerprint className="h-6 w-6 text-orange-200" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col items-center justify-center gap-2">
                  <div className="flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 backdrop-blur-sm border border-white/5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-green-100/90">
                      Active Identity
                    </span>
                  </div>
                  <p className="text-2xl font-bold tracking-wide drop-shadow-sm">
                    {loadingId ? (
                      <span className="inline-flex items-center gap-2 text-white/70 text-base">
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                      </span>
                    ) : (
                      meduraId ?? "Not available"
                    )}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-white/60">
                      Beneficiary
                    </p>
                    <p className="text-lg font-bold tracking-wide text-white drop-shadow-sm">
                      {user.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-white/60">
                      Medura ID
                    </p>
                    <div className="font-mono text-sm font-semibold tracking-widest text-white/90 drop-shadow-sm">
                      {loadingId ? "..." : user.medura}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK FACE */}
          <div
            className="absolute inset-0 h-full w-full backface-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/20 bg-white p-6 shadow-2xl">
              <div className="flex h-full flex-col items-center justify-center gap-4">
                <div className="rounded-xl bg-white p-2 shadow-inner">
                  <QRCodeSVG
                    value={qrData}
                    size={140}
                    level="Q"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <p className="text-xs font-medium text-gray-500">Scan for Instant Emergency Access</p>
                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-semibold text-white transition-transform active:scale-95"
                  >
                    <Copy className="h-4 w-4" />
                    {copyStatus === "copied" ? "Copied" : "Copy Medura ID"}
                  </button>
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4D7CFF] py-3 text-sm font-semibold text-white active:scale-95 transition-transform">
                    <Share2 className="h-4 w-4" />
                    Share Digital Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex justify-center">
        <p className="flex items-center gap-1.5 text-xs text-white/40">
          <CheckCircle className="h-3 w-3" />
          <span className="tracking-wide">KYC VERIFIED • TAP TO FLIP</span>
        </p>
      </div>
    </div>
  );
}
