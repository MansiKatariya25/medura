"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Suspense } from "react";
import SmoothScroll from "@/components/providers/SmoothScroll";
import DoctorBottomNav from "@/components/navigation/DoctorBottomNav";
import AmbulanceBottomNav from "@/components/navigation/AmbulanceBottomNav";
import PresenceSocket from "@/components/realtime/PresenceSocket";
import CallListener from "@/components/realtime/CallListener";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SmoothScroll>
        <PresenceSocket />
        <CallListener />
        {children}
        <Suspense fallback={null}>
          <DoctorBottomNav />
          <AmbulanceBottomNav />
        </Suspense>
      </SmoothScroll>
    </SessionProvider>
  );
}
