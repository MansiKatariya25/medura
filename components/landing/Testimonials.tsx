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
        image: "https://res.cloudinary.com/dr3hkbpmr/image/upload/v1766314201/medura/landing/landing-04.jpg" // Generic portrait
    },
    {
        id: 2,
        quote: "As a doctor, getting the patient's history via MedKey before they even arrive at the ER is a game changer.",
        author: "Dr. Priya S.",
        role: "Apollo Hospitals",
        stars: 5,
        image: "https://res.cloudinary.com/dr3hkbpmr/image/upload/v1766314199/medura/landing/landing-03.jpg" // Female doctor
    },
    {
        id: 3,
        quote: "The interface is so simple. Even my elderly parents could use it without confusion during an emergency.",
        author: "Meera K.",
        role: "Mumbai",
        stars: 5,
        image: "https://res.cloudinary.com/dr3hkbpmr/image/upload/v1766314196/medura/landing/landing-02.jpg" // Patient with laptop
    },
];

export default function Testimonials() {
    return (
        <section className="py-24 px-4 bg-[#05060B]">
            <div className="container mx-auto max-w-6xl">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold text-white font-[family-name:var(--font-dm-sans)]">
                        Trusted by Thousands
                    </h2>
                    <p className="mt-3 text-white/60">
                        Stories from patients and doctors using Medura every day.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {testimonials.map((t, index) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col rounded-2xl border border-white/10 bg-[#0f1116] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                        >
                            <div className="mb-4 flex gap-1">
                                {[...Array(t.stars)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-yellow-500 text-yellow-500"
                                    />
                                ))}
                            </div>
                            <p className="mb-6 flex-1 text-base italic text-white/70 leading-relaxed">
                                &quot;{t.quote}&quot;
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/10">
                                    <Image
                                        src={t.image}
                                        alt={t.author}
                                        fill
                                        sizes="40px"
                                        unoptimized
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
