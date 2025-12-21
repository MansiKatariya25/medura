"use client";

import Link from "next/link";

export default function AuthLanding() {
  return (
    <main className="min-h-screen bg-[#05060B] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-white/70">MEDURA</p>
          <h1 className="mt-2 text-3xl font-semibold">Continue as</h1>
          <p className="mt-2 text-sm text-white/60">Choose your role to sign in or sign up</p>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          <Link href="/auth/patient" className="rounded-2xl border border-white/10 bg-[#0e1120] p-6 text-center hover:scale-[1.01] transition">
            <div className="text-lg font-semibold">Patient</div>
            <p className="mt-2 text-sm text-white/60">Sign in or sign up as a patient</p>
          </Link>

          <Link href="/auth/doctor" className="rounded-2xl border border-white/10 bg-[#0e1120] p-6 text-center hover:scale-[1.01] transition">
            <div className="text-lg font-semibold">Doctor</div>
            <p className="mt-2 text-sm text-white/60">Doctor sign up / login (specialization, DOB)</p>
          </Link>

          <Link href="/auth/ambulance" className="rounded-2xl border border-white/10 bg-[#0e1120] p-6 text-center hover:scale-[1.01] transition">
            <div className="text-lg font-semibold">Ambulance</div>
            <p className="mt-2 text-sm text-white/60">Ambulance / rider signup (vehicle, phone)</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
