"use client";

import { motion } from "framer-motion";
import { Hand, Map, Share2 } from "lucide-react";

const steps = [
    {
        id: 1,
        title: "Slide SOS",
        description: "One swipe connects you to the nearest ambulance dispatcher instantly.",
        icon: Hand,
    },
    {
        id: 2,
        title: "Track Ambulance",
        description: "Real-time GPS tracking of the vehicle dispatched to your location.",
        icon: Map,
    },
    {
        id: 3,
        title: "Share MedKey",
        description: "Scanning your QR code gives paramedics your vital medical data.",
        icon: Share2,
    },
];

export default function HowItWorks() {
    return (
        <section className="relative py-32">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-b from-white to-white/60 font-[family-name:var(--font-dm-sans)]">
                        How Medura Works
                    </h2>
                </div>

                <div className="relative grid md:grid-cols-3 gap-12">
                    {/* Connecting Line (Only visible on Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="relative flex flex-col items-center text-center group"
                        >
                            <div className="relative z-10 w-24 h-24 rounded-2xl bg-[#091E42] border border-white/10 flex items-center justify-center mb-6 shadow-2xl group-hover:border-blue-500/50 transition duration-300">
                                <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition duration-300" />
                                <step.icon className="w-10 h-10 text-white/80 group-hover:text-blue-400 transition duration-300" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm border-4 border-[#091E42]">
                                    {step.id}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3 font-[family-name:var(--font-dm-sans)]">{step.title}</h3>
                            <p className="text-white/50 max-w-xs leading-relaxed">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
