"use client";

import { useEffect, useMemo, useState } from "react";
import { Home, Users, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type NotificationItem = {
  id: string;
  read: boolean;
};

export default function AmbulanceBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const role = (session?.user as any)?.role;
  const isAmbulance =
    pathname.startsWith("/ambulance") ||
    (status === "authenticated" && role === "ambulance");

  const hideForChat =
    pathname.startsWith("/community/") && pathname !== "/community";
  const hideForAuth = pathname.startsWith("/auth");
  const hideForLanding = pathname === "/" || pathname === "/landing";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("medura:notifications");
    if (!raw) return;
    try {
      setNotifications(JSON.parse(raw) as NotificationItem[]);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const raw = window.localStorage.getItem("medura:notifications");
      if (!raw) return;
      try {
        setNotifications(JSON.parse(raw) as NotificationItem[]);
      } catch {
        // ignore
      }
    };
    window.addEventListener("medura:notifications-update", handler);
    return () => window.removeEventListener("medura:notifications-update", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeKey = useMemo(() => {
    if (pathname === "/ambulance") return "home";
    if (pathname === "/community") return "community";
    if (pathname === "/profile") return "profile";
    return "";
  }, [pathname]);

  if (!isAmbulance || hideForChat || hideForAuth || hideForLanding) return null;

  return (
    <nav className="fixed bottom-6 left-1/2 z-20 w-[90%] max-w-[420px] -translate-x-1/2 rounded-full bg-[#151621] px-6 py-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.4)] lg:max-w-lg">
      <div className="flex items-center justify-between">
        {[
          { id: "home", label: "Home", icon: Home, href: "/ambulance" },
          { id: "community", label: "Community", icon: Users, href: "/community" },
          { id: "profile", label: "Profile", icon: User, href: "/profile" },
        ].map((item) => {
          const isActive = activeKey === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center text-xs ${isActive ? "text-white" : "text-white/50"}`}
            >
              <item.icon className={`mb-1 h-5 w-5 ${isActive ? "text-white" : "text-white/60"}`} />
              {item.label}
            </button>
          );
        })}
        {unreadCount > 0 ? (
          <span className="hidden" aria-hidden />
        ) : null}
      </div>
    </nav>
  );
}
