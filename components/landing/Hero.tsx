"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight, Phone, Play, ShieldAlert } from "lucide-react";
import FluidBackground from "@/components/landing/ui/FluidBackground";
import Image from "next/image";

export default function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]); // Text Parallax
  const y2 = useTransform(scrollY, [0, 500], [0, -100]); // Phone Parallax

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
    // Only apply on window if available (client-side)
    if (typeof window !== "undefined") {
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth) - 0.5);
      mouseY.set((clientY / innerHeight) - 0.5);
    }
  }

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  // Spring smoothing for mouse parallax
  const smoothRotateX = useSpring(rotateX, { stiffness: 100, damping: 20 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 100, damping: 20 });

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-28 pb-16"
    >
      <FluidBackground />

      <div className="absolute inset-0 -z-20 h-full w-full opacity-25">
        <Image
          src="https://res.cloudinary.com/dr3hkbpmr/image/upload/v1766314194/medura/landing/landing-01.jpg"
          alt="Medical Emergency Background"
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-[#05060B]/70 via-[#05060B]/85 to-[#05060B]" />
      <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-[#4D7CFF]/10 blur-[120px]" />

      <div className="container relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        {/* Left Content */}
        <motion.div
          style={{ y: y1 }}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF3535] opacity-60"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FF3535]"></span>
            </span>
            Live in 20+ Cities
          </motion.div>

          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl font-(family-name:--font-dm-sans)">
            <span className="block overflow-hidden">
              <motion.span
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="block bg-linear-to-br from-white via-white to-white/60 bg-clip-text text-transparent"
              >
                Every Second
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: "circOut", delay: 0.1 }}
                className="relative block text-[#4D7CFF]"
              >
                Counts.
                {/* Glowing underline */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute bottom-2 left-0 h-2 w-full bg-[#4D7CFF]/25 blur-lg"
                />
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-white/65"
          >
            India&apos;s fastest emergency response platform. One-slide SOS, real-time
            ambulance tracking, and AI-powered triage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 flex flex-col gap-4 sm:flex-row"
          >
            <button
              onClick={() => (window.location.href = "/auth")}
              className="group relative flex items-center justify-center gap-3 rounded-full bg-[#FF3535] px-8 py-4 font-bold text-white shadow-[0_12px_30px_rgba(255,53,53,0.35)] transition hover:shadow-[0_18px_40px_rgba(255,53,53,0.45)] active:scale-95"
            >
              <ShieldAlert className="h-5 w-5 animate-pulse" />
              <span>Get Help Now</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById("why-medura");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>View Features</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-10 flex items-center gap-4 text-sm text-white/50"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border border-black bg-[#11121A] ring-2 ring-[#05060B]"
                />
              ))}
            </div>
            <p>Trusted by 10k+ patients</p>
          </motion.div>
        </motion.div>

        {/* Right Visual - Phone Mockup with 3D Tilt */}
        <motion.div
          style={{
            y: y2,
            rotateX: smoothRotateX,
            rotateY: smoothRotateY
          }}
          className="relative mx-auto w-full max-w-[320px] lg:mr-0"
        >
          {/* Simple Phone Mockup Shape */}
          <div className="relative z-10 mx-auto aspect-9/19 w-full max-w-75 overflow-hidden rounded-[36px] border border-white/10 bg-[#0B0C12] shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
            {/* Screen Content */}
            <div className="flex h-full w-full flex-col bg-[#0F172A] p-4 text-white">
              <div className="flex items-center justify-between opacity-50">
                <span className="text-xs font-medium">9:41</span>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
                </div>
              </div>

              <div className="mt-8">
                <div className="mx-auto h-24 w-24 rounded-full bg-red-500/20 p-4">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FF3535] text-white shadow-lg shadow-red-500/40 animate-pulse">
                    <Phone className="h-8 w-8 fill-current" />
                  </div>
                </div>
                <h3 className="mt-4 text-center text-xl font-bold font-(family-name:--font-dm-sans)">SOS Mode</h3>
                <p className="text-center text-xs text-white/50">Slide below to call ambulance</p>
              </div>

              {/* Slider UI */}
              <div className="relative mt-auto mb-8 h-16 w-full rounded-full bg-white/5 p-2">
                <div className="absolute top-2 bottom-2 left-2 w-12 rounded-full bg-[#FF3535] shadow-lg flex items-center justify-center">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
                <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white/40">
                  Slide to Call
                </div>
              </div>
            </div>

            {/* Glossy Overlay */}
            <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-white/10 to-transparent opacity-40 rounded-[36px]" />
          </div>

          {/* Decorative Elements around phone */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-blue-500/30 blur-3xl -z-10"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-red-500/20 blur-2xl -z-10"
          />
        </motion.div>
      </div>
    </section>
  );
}
