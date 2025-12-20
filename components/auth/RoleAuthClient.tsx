"use client";

import React from "react";
import AuthScreen from "@/components/auth/AuthScreen";
import DoctorAuth from "@/components/auth/DoctorAuth";
import AmbulanceAuth from "@/components/auth/AmbulanceAuth";

export default function RoleAuthClient({ role }: { role?: string }) {
  const r = (role || "").toLowerCase();
  if (r === "doctor" || r === "dr" || r === "drs") return <DoctorAuth />;
  if (r === "ambulance" || r === "amb") return <AmbulanceAuth />;
  if (r === "patient" || r === "user") return <AuthScreen />;

  return (
    <main className="min-h-screen bg-[#05060B] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-8">
        <h2 className="text-xl font-semibold">Unknown authentication role</h2>
        <p className="text-sm text-white/60">Visit <code>/auth/patient</code>, <code>/auth/doctor</code>, or <code>/auth/ambulance</code></p>
      </div>
    </main>
  );
}
