"use client";

import { motion } from "framer-motion";
import { User, Stethoscope, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Ecosystem() {
    return (
        <section className="py-24 px-4 bg-[#091E42]">
            <div className="container mx-auto max-w-6xl">
                <div className="mb-16 text-center">
                    <span className="text-blue-500 font-semibold tracking-wider text-sm uppercase">The Ecosystem</span>
                    <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl font-(family-name:--font-dm-sans)">
                        Built for Everyone
                    </h2>
                    <p className="mt-4 text-white/60">
                        Connecting patients in need with the best responders and doctors.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* Patients Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:bg-white/10"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <User className="h-32 w-32 text-blue-500/20 -rotate-12 transform" />
                        </div>
                        <div className="absolute inset-0 -z-10 opacity-20 hover:opacity-30 transition duration-500">
                            <Image
                                src="https://res.cloudinary.com/dr3hkbpmr/image/upload/v1766314196/medura/landing/landing-02.jpg"
                                alt="Happy Patient"
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                unoptimized
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-[#091E42]/80 mix-blend-multiply" />
                        </div>

                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white font-(family-name:--font-dm-sans)">For Patients</h3>
                            <p className="mt-2 text-white/60">Fastest response when you need it most.</p>

                            <ul className="mt-8 space-y-4">
                                {["One-tap Ambulance Call", "Real-time Family Alerts", "Digital Health Recods"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link href="/auth/patient" className="mt-8 inline-flex items-center gap-2 text-blue-400 font-semibold group-hover:gap-3 transition-all">
                                Download App <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Doctors Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:bg-white/10"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50">
                            <Stethoscope className="h-32 w-32 text-green-500/20 -rotate-12 transform" />
                        </div>
                        <div className="absolute inset-0 -z-10 opacity-20 hover:opacity-30 transition duration-500">
                            <Image
                                src="https://res.cloudinary.com/dr3hkbpmr/image/upload/v1766314199/medura/landing/landing-03.jpg"
                                alt="Doctor"
                                fill
                                sizes="(min-width: 768px) 50vw, 100vw"
                                unoptimized
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-[#091E42]/80 mix-blend-multiply" />
                        </div>

                        <div className="relative z-10">
                            <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center mb-6">
                                <Stethoscope className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white font-(family-name:--font-dm-sans)">For Doctors</h3>
                            <p className="mt-2 text-white/60">Streamlined triage and patient management.</p>

                            <ul className="mt-8 space-y-4">
                                {["Video Telemedicine", "Instant Patient History (ABHA)", "Smart AI Triage Summary"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white/80">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link href="/auth/doctor" className="mt-8 inline-flex items-center gap-2 text-green-400 font-semibold group-hover:gap-3 transition-all">
                                Partner with us <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
