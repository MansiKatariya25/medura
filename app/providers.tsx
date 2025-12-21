"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import NotificationListener from "@/components/notifications/NotificationListener";
import DoctorBottomNav from "@/components/navigation/DoctorBottomNav";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NotificationListener />
      {children}
      <DoctorBottomNav />
    </SessionProvider>
  );
}

