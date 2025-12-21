"use client";

import Link from "next/link";
import { Activity, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 pt-4"
    >
      <div className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-[#0B0C12]/85 px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-500">
            {/* <Activity className="h-5 w-5 animate-pulse" /> */}
            <img src="/medura.png" alt="Medura Logo" className="h-5 w-5 animate-pulse" />
            <div className="absolute inset-0 animate-ping rounded-lg bg-blue-500/20" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-[family-name:var(--font-dm-sans)]">
            Medura
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/auth/patient"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            For Patients
          </Link>
          <Link
            href="/auth/doctor"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            For Doctors
          </Link>
          <Link
            href="/auth/ambulance"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            For Ambulance
          </Link>
          <Link
            href="/auth/patient"
            className="group relative overflow-hidden rounded-full bg-linear-to-r from-[#2D7BE8] via-[#4D7CFF] to-[#2D7BE8] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_25px_rgba(77,124,255,0.35)] transition hover:shadow-[0_16px_35px_rgba(77,124,255,0.45)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started
            </span>
            <div className="absolute inset-0 -z-0 translate-y-full bg-linear-to-r from-[#1F3A67] to-[#4D7CFF] transition-transform duration-300 group-hover:translate-y-0" />
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-white/70 hover:bg-white/10 md:hidden"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            className="absolute top-20 left-4 right-4 z-40 rounded-2xl border border-white/10 bg-[#0B0C12]/95 p-6 shadow-2xl backdrop-blur-3xl md:hidden"
          >
            <nav className="flex flex-col gap-4">
              <Link
                href="/auth/patient"
                className="flex items-center justify-between rounded-xl bg-white/5 p-4 text-white hover:bg-white/10"
              >
                <span>For Patients</span>
                <Activity className="h-4 w-4 text-blue-500" />
              </Link>
              <Link
                href="/auth/doctor"
                className="flex items-center justify-between rounded-xl bg-white/5 p-4 text-white hover:bg-white/10"
              >
                <span>For Doctors</span>
                <Activity className="h-4 w-4 text-blue-500" />
              </Link>
              <Link
                href="/auth/ambulance"
                className="flex items-center justify-between rounded-xl bg-white/5 p-4 text-white hover:bg-white/10"
              >
                <span>For Ambulance</span>
                <Activity className="h-4 w-4 text-blue-500" />
              </Link>
              <Link
                href="/auth/patient"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4D7CFF] p-4 font-semibold text-white"
              >
                Get Started
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
