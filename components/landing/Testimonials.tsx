"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import Image from "next/image";

const testimonials = [
    {
        id: 1,
        quote: "The SOS feature literally saved my father's life during his cardiac arrest. The ambulance arrived in 7 minutes.",
        author: "Aditya R.",
        role: "Bangalore",
        stars: 5,
        image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg" // Generic portrait
    },
    {
        id: 2,
        quote: "As a doctor, getting the patient's history via MedKey before they even arrive at the ER is a game changer.",
        author: "Dr. Priya S.",
        role: "Apollo Hospitals",
        stars: 5,
        image: "https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg" // Female doctor
    },
    {
        id: 3,
        quote: "The interface is so simple. Even my elderly parents could use it without confusion during an emergency.",
        author: "Meera K.",
        role: "Mumbai",
        stars: 5,
        image: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg" // Patient with laptop
    },
];

export default function Testimonials() {
    return (
        <section className="py-24 px-4 bg-[#091E42]">
            <div className="container mx-auto max-w-6xl">
                <h2 className="mb-12 text-center text-3xl font-bold text-white font-[family-name:var(--font-dm-sans)]">
                    Trusted by Thousands
                </h2>

                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-xl backdrop-blur-sm hover:bg-white/[0.04]"
                        >
                            <div className="mb-4 flex gap-1">
                                {[...Array(t.stars)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-yellow-500 text-yellow-500"
                                    />
                                ))}
                            </div>
                            <p className="mb-6 flex-1 text-lg italic text-white/70 leading-relaxed">
                                &quot;{t.quote}&quot;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10">
                                    <Image
                                        src={t.image}
                                        alt={t.author}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="font-semibold text-white font-[family-name:var(--font-dm-sans)]">{t.author}</div>
                                    <div className="text-xs text-white/40">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
