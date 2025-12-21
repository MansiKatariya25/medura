"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import NotificationListener from "@/components/notifications/NotificationListener";
import DoctorBottomNav from "@/components/navigation/DoctorBottomNav";
import AmbulanceBottomNav from "@/components/navigation/AmbulanceBottomNav";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NotificationListener />
      {children}
      <DoctorBottomNav />
      <AmbulanceBottomNav />
    </SessionProvider>
  );
}

