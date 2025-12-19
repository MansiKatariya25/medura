"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Fingerprint, SlidersHorizontal, Share2, Copy, CheckCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function MedKeyCard() {
    const { data: session } = useSession();
    const [isFlipped, setIsFlipped] = useState(false);
    const [slideProgress, setSlideProgress] = useState(0);

    // Fallback for demo
    const user = {
        name: session?.user?.name || "Aditya Kumar",
        id: session?.user?.id || "65a123bcde...",
        abha: session?.user?.medKey?.abhaNumber || "12-3456-7890-1234",
        bloodGroup: session?.user?.medKey?.bloodGroup || "O+",
    };

    const qrData = JSON.stringify({
        uid: user.id,
        bg: user.bloodGroup,
        action: "MEDURA_EMERGENCY_ACCESS",
    });

    const handleFlip = () => {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(10);
        }
        setIsFlipped(!isFlipped);
    };

    return (
        <div className="relative mx-auto w-full max-w-sm">
            <div className="perspective-1000 relative aspect-[1.586/1] w-full">
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
                        <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/20 bg-linear-to-br from-blue-600 via-indigo-600 to-orange-500 p-6 shadow-2xl backdrop-blur-2xl">
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 -skew-x-12 translate-x-[-150%] animate-[shimmer_3s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />

                            <div className="flex h-full flex-col justify-between text-white">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 shadow-inner backdrop-blur-md">
                                            <div className="h-3 w-3 rounded-sm bg-white" />
                                        </div>
                                        <span className="text-lg font-bold tracking-tight text-white drop-shadow-md">Medura</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80">ABHA</div>
                                            <div className="text-[9px] font-medium leading-none text-white/60">Official</div>
                                        </div>
                                        <Fingerprint className="h-6 w-6 text-orange-200" />
                                    </div>
                                </div>

                                {/* Center Badge */}
                                <div className="flex flex-1 items-center justify-center">
                                    <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1.5 backdrop-blur-sm border border-white/5">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-green-100/90">Active Identity</span>
                                    </div>
                                </div>

                                {/* Footer Details */}
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-white/60">Beneficiary</p>
                                        <p className="text-lg font-bold tracking-wide text-white drop-shadow-sm">{user.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="mb-0.5 text-[10px] font-medium uppercase tracking-widest text-white/60">ABHA Number</p>
                                        <div className="font-mono text-sm font-semibold tracking-widest text-white/90 drop-shadow-sm">
                                            {/* Mask all but last 4 for privacy until flipped */}
                                            <span className="opacity-60">XX-XXXX-XXXX-</span>{user.abha.slice(-4)}
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

                                <div className="w-full">
                                    {/* Fake generic slide to share */}
                                    <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-semibold text-white active:scale-95 transition-transform">
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
