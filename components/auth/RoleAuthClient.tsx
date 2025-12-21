"use client";

import React from "react";
import AuthScreen from "@/components/auth/AuthScreen";
import DoctorAuth from "@/components/auth/DoctorAuth";
import AmbulanceAuth from "@/components/auth/AmbulanceAuth";

export default function RoleAuthClient({ role }: { role?: string }) {
  const r = (role || "").toLowerCase();
  if (r === "doctor" || r === "dr" || r === "drs") return <DoctorAuth />;
  if (r === "ambulance" || r === "amb") return <AmbulanceAuth />;
  // Default to patient for any unknown or missing role
  return <AuthScreen />;
}
