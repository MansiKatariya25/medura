"use client";

import { motion } from "framer-motion";
import { Scan, QrCode } from "lucide-react";

export default function MedKeySpotlight() {
    return (
        <section className="relative overflow-hidden py-28 px-4 bg-[#05060B]">
            <div className="absolute inset-0">
                <div className="absolute -top-24 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[#4D7CFF]/10 blur-[120px]" />
                <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-[#FFB020]/10 blur-[120px]" />
            </div>

            <div className="container relative z-10 mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-center">
                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="order-2 lg:order-1"
                >
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
                        <Scan className="w-3 h-3" />
                        VitalID / MedKey
                    </div>
                    <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl font-[family-name:var(--font-dm-sans)]">
                        Your Medical History, <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#4D7CFF] to-[#9BB6FF]">
                            Unlocked in 0.1s.
                        </span>
                    </h2>
                    <p className="mb-8 text-lg text-white/60 leading-relaxed">
                        Powered by MedKey unique ID. Securely share your allergies,
                        blood group, and past prescriptions with doctors instantly via QR.
                    </p>

                    <ul className="space-y-4">
                        {[
                            "MedKey verified identity",
                            "End-to-End Encrypted",
                            "Works offline via NFC"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-white/80">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Visual: Floating Card */}
                <div className="order-1 flex justify-center lg:order-2">
                    <motion.div
                        initial={{ rotateY: 30, rotateX: 10, opacity: 0 }}
                        whileInView={{ rotateY: -10, rotateX: 5, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        viewport={{ once: true }}
                        whileHover={{ rotateY: 0, rotateX: 0, scale: 1.05 }}
                        className="relative h-64 w-96 rounded-2xl border border-white/10 bg-[#0f1116] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-all duration-500 group"
                    >
                        {/* Card Content */}
                        <div className="absolute inset-0 z-0 bg-linear-to-br from-white/5 to-transparent rounded-2xl" />

                        <div className="relative z-10 flex justify-between items-start">
                            <div className="flex gap-2 items-center">
                                <div className="h-8 w-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Scan className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs text-white/40 font-mono">MEDKEY ID</div>
                                    <div className="font-bold text-white tracking-widest">**** 4921</div>
                                </div>
                            </div>
                            <div className="bg-[#4D7CFF]/15 text-[#9BB6FF] px-2 py-1 rounded text-[10px] font-bold border border-[#4D7CFF]/30">
                                MEDKEY READY
                            </div>
                        </div>

                        <div className="relative z-10 mt-12 flex gap-4">
                            <div className="h-20 w-20 bg-white/10 rounded-lg p-1">
                                <div className="h-full w-full bg-white rounded-sm flex items-center justify-center">
                                    <QrCode className="w-12 h-12 text-black" />
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                <div className="text-xs text-white/40">NAME</div>
                                <div className="text-sm font-semibold text-white">Rohit Sharma</div>
                                <div className="mt-2 text-xs text-white/40">BLOOD GROUP</div>
                                <div className="text-sm font-semibold text-white">O+ Positive</div>
                            </div>
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-blue-500/20 via-orange-500/20 to-purple-500/20 blur-xl opacity-0 transition group-hover:opacity-100" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
