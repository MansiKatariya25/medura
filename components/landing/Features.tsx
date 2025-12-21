"use client";

import { motion } from "framer-motion";
import { Bell, MapPin, Sparkles, QrCode, Users } from "lucide-react";

const features = [
    {
        title: "One-Slide SOS",
        description: "Instant connection to the nearest ER. No dialing needed.",
        icon: Bell,
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        className: "md:col-span-2",
    },
    {
        title: "Live Tracking",
        description: "Watch your ambulance arrive in real-time on the map.",
        icon: MapPin,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        className: "md:col-span-1",
    },
    {
        title: "AI Triage Bot",
        description: "Immediate first-aid guidance while you wait for help.",
        icon: Sparkles,
        color: "text-purple-500",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        className: "md:col-span-1",
    },
    {
        title: "MedKey Integration",
        description: "MedKey digital health passport.",
        icon: QrCode,
        color: "text-orange-500",
        bg: "bg-orange-500/10",
        border: "border-orange-500/20",
        className: "md:col-span-1",
        visual: true,
    },
    {
        title: "Community Awareness",
        description: "Discover nearby sessions and stay updated with local health groups.",
        icon: Users,
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        className: "md:col-span-1",
    },
];

export default function Features() {
    return (
        <section id="why-medura" className="bg-[#05060B] py-24 px-4">
            <div className="container mx-auto max-w-6xl">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl font-(family-name:--font-dm-sans)">
                        Why Medura?
                    </h2>
                    <p className="mt-4 text-lg text-white/60">
                        Advanced features designed for speed and reliability.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1116] p-8 ${feature.className} transition`}
                        >
                            <div
                                className={`mb-4 inline-flex items-center justify-center rounded-xl p-3 ${feature.bg} ${feature.color}`}
                            >
                                <feature.icon className="h-6 w-6" />
                            </div>

                            <h3 className="mb-2 text-xl font-bold text-white font-(family-name:--font-dm-sans)">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-white/60 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Decorative gradient blob */}
                            <div
                                className={`absolute -right-10 -bottom-10 h-32 w-32 rounded-full opacity-15 blur-2xl ${feature.bg}`}
                            />

                            {feature.visual && (
                                <div className="absolute right-4 bottom-4 h-16 w-16 opacity-50 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                                    <QrCode className="w-8 h-8 text-white/50" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
