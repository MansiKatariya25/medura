"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import {
  Activity,
  Ambulance,
  Baby,
  Bell,
  Brain,
  Calendar,
  ChevronsLeft,
  FileText,
  HeartPulse,
  Home,
  MapPin,
  Search,
  Star,
  User,
  Users,
  X,
  Video,
  Plus,
} from "lucide-react";

import { doctors as seedDoctors } from "@/data/doctors";
import { activePrescriptions, recentLabs, recentImaging } from "@/data/records";
import MedKeyCard from "@/components/home/MedKeyCard";
import UploadRecordModal from "@/components/home/UploadRecordModal";
import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import type { Doctor } from "@/schemas/doctor";


type IconComponent = ComponentType<{ className?: string }>;

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const categoryIconMap: Record<string, IconComponent> = {
  all: HeartPulse,
  neuro: Brain,
  pediatric: Baby,
  general: Activity,
  cardio: HeartPulse,
};

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "community", label: "Community", icon: Users },
  { id: "medkey", label: "MedKey", icon: FileText },
  { id: "profile", label: "Profile", icon: User },
];

function useLocationLabel() {
  const initial =
    typeof navigator !== "undefined" && "geolocation" in navigator
      ? "Locating..."
      : "Location unavailable";
  const [label, setLabel] = useState(initial);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const controller = new AbortController();
    let cancelled = false;

    const updateLabel = async (lat: number, lng: number) => {
      try {
        const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) {
          if (!cancelled) setLabel("Location unavailable");
          return;
        }
        const data = (await res.json()) as { label?: string };
        const text = data.label ? `${data.label.slice(0, 18)}…` : "Location unavailable";
        if (!cancelled) setLabel(text);
      } catch {
        if (!cancelled) setLabel("Location unavailable");
      }
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => updateLabel(pos.coords.latitude, pos.coords.longitude),
      () => {
        if (!cancelled) setLabel("Location unavailable");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 },
    );

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return label;
}

function RoundedIconButton({
  className = "",
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-[#202331] text-white ${className}`}
    >
      {children}
    </button>
  );
}

export default function HomeDashboard({ userName }: { userName: string }) {
  const locationLabel = useLocationLabel();
  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recordSearchQuery, setRecordSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [doctorList, setDoctorList] = useState<Doctor[]>([]);
  const [categoryOptions, setCategoryOptions] = useState([
    { id: "all", label: "All Doctors" },
  ]);
  const [doctorPage, setDoctorPage] = useState(1);
  const [hasMoreDoctors, setHasMoreDoctors] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [selectedTab, setSelectedTab] = useState("home");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedRecords, setUploadedRecords] = useState<{ id: string, type: string, title: string, date: string, status?: string }[]>([]);
  const [displayedTab, setDisplayedTab] = useState("home");
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [callState, setCallState] = useState<
    "idle" | "ready" | "sliding" | "calling"
  >("idle");
  const [slideProgress, setSlideProgress] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const collapsedCategoryLimit = 6;
  const holdTimer = useRef<number | null>(null);
  const startX = useRef(0);
  const countdownRef = useRef<number | null>(null);
  const readyTimeout = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;
    if (["home", "community", "medkey", "profile"].includes(tab)) {
      setSelectedTab(tab);
      setDisplayedTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        const res = await fetch("/api/doctors/categories", {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          categories?: { id: string; label: string }[];
        };
        if (!mounted) return;
        if (Array.isArray(data?.categories) && data.categories.length > 0) {
          setCategoryOptions([
            { id: "all", label: "All Doctors" },
            ...data.categories,
          ]);
        }
      } catch {
        // ignore
      }
    };

    loadCategories();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const fetchDoctors = useCallback(async (page: number, append: boolean) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingDoctors(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "8",
      });
      if (activeCategory && activeCategory !== "all") {
        params.set("category", activeCategory);
      }
      if (searchQuery.trim()) {
        params.set("query", searchQuery.trim());
      }
      const res = await fetch(`/api/doctors?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        doctors?: Doctor[];
        hasMore?: boolean;
      };
      if (Array.isArray(data?.doctors)) {
        setDoctorList((prev) =>
          append ? [...prev, ...data.doctors!] : data.doctors!
        );
      }
      if (typeof data?.hasMore === "boolean") {
        setHasMoreDoctors(data.hasMore);
      } else {
        setHasMoreDoctors(false);
      }
      setDoctorPage(page);
      if (!append && data?.doctors && data.doctors.length === 0) {
        setDoctorList([]);
      }
    } catch {
      if (!append) {
        setDoctorList(seedDoctors);
      }
    } finally {
      loadingMoreRef.current = false;
      setLoadingDoctors(false);
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setIsLoading(true);
    setDoctorPage(1);
    setHasMoreDoctors(true);
    fetchDoctors(1, false);
  }, [activeCategory, fetchDoctors, searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("medura:notifications");
    if (raw) {
      try {
        setNotifications(JSON.parse(raw) as NotificationItem[]);
        return;
      } catch {
        // ignore
      }
    }
    setNotifications([
      {
        id: "notif-1",
        title: "Community update",
        body: "Heart Care Circle posted a new session for Saturday.",
        time: "2m ago",
        read: false,
      },
      {
        id: "notif-2",
        title: "MedKey synced",
        body: "Your health records were successfully synced.",
        time: "1h ago",
        read: false,
      },
      {
        id: "notif-3",
        title: "Doctor availability",
        body: "Dr. Anurag is available for video consults.",
        time: "Yesterday",
        read: true,
      },
    ]);
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
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "medura:notifications",
      JSON.stringify(notifications),
    );
  }, [notifications]);


  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasMoreDoctors &&
          !loadingMoreRef.current &&
          !loadingDoctors
        ) {
          fetchDoctors(doctorPage + 1, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [doctorPage, fetchDoctors, hasMoreDoctors, loadingDoctors]);

  useEffect(() => {
    const read = () => {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("medura:profile-image");
      setAvatarImage(stored);
    };
    read();
    const listener = (event: StorageEvent) => {
      if (event.key === "medura:profile-image") {
        read();
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (readyTimeout.current) {
        clearTimeout(readyTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (callState !== "calling") {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    const initId = window.setTimeout(() => setCountdown(1), 0);
    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          setCallState("idle");
          setSlideProgress(0);
          router.push("/emergency");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearTimeout(initId);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState]);

  useEffect(() => {
    if (callState !== "ready") {
      if (readyTimeout.current) {
        clearTimeout(readyTimeout.current);
        readyTimeout.current = null;
      }
      return;
    }

    readyTimeout.current = window.setTimeout(() => {
      setCallState("idle");
      setSlideProgress(0);
    }, 1500);

    return () => {
      if (readyTimeout.current) {
        clearTimeout(readyTimeout.current);
        readyTimeout.current = null;
      }
    };
  }, [callState]);

  const handleTabChange = (tab: string) => {
    if (tab === selectedTab) return;
    setSelectedTab(tab);
    setTransitioning(true);
    setTimeout(() => {
      setDisplayedTab(tab);
      setTransitioning(false);
    }, 240);
  };

  const visibleDoctors = useMemo(() => doctorList, [doctorList]);

  const heroDoctors = visibleDoctors.slice(0, 4);
  const featuredDoctor = visibleDoctors[0];
  const listDoctors = visibleDoctors.slice(4);

  const renderHomeSections = () => (
    <>
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white">
            {avatarImage ? (
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${avatarImage})` }}
              />
            ) : (
              <Image
                src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80"
                alt={userName}
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            )}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">{userName}</p>
            <p className="text-sm text-white/70">Good afternoon</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative rounded-full border border-white/20 bg-white/25 p-3 text-white/70"
              aria-label="Notifications"
              onClick={() => router.push("/notifications")}
            >
              <Bell className="h-4 w-4 text-white" />
              {notifications.some((n) => !n.read) ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {notifications.filter((n) => !n.read).length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
        <div className="flex w-full items-center gap-3">
          <div className="flex w-full items-center gap-2 rounded-full border border-white/40 p-1 text-sm text-white/60">
            <div className="flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm whitespace-nowrap">
              <MapPin className="h-5 w-5 text-white" />
              {locationLabel}
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm text-white/60">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="h-5 w-px rounded-full bg-white/30" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search doctors"
                  className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/35 focus:outline-none"
                  aria-label="Search doctors"
                />
              </div>
              <button className="rounded-full p-2 text-white">
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-white">Doctors Category</h2>
          {categoryOptions.length > collapsedCategoryLimit ? (
            <button
              className="text-sm text-gray-500 transition-colors hover:text-gray-300"
              onClick={() => setShowAllCategories((prev) => !prev)}
            >
              {showAllCategories ? "See less" : "See all"}
            </button>
          ) : null}
        </div>

        <div
          className={`${showAllCategories ? "flex flex-wrap gap-2" : "flex gap-2 overflow-x-auto scrollbar-hide"} pb-2`}
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-chip-${index}`}
                className="h-8 w-24 rounded-4xl bg-white/10 animate-pulse"
              />
            ))
            : (showAllCategories
                ? categoryOptions
                : categoryOptions.slice(0, collapsedCategoryLimit)
              ).map((category) => {
              const CategoryIcon =
                categoryIconMap[category.id] || HeartPulse;
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-1 rounded-4xl px-3 py-2 text-sm transition-colors ${showAllCategories ? "shrink" : "shrink-0"} ${isActive
                    ? "bg-white/35 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  style={showAllCategories ? { maxWidth: "48%" } : undefined}
                >
                  <CategoryIcon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{category.label}</span>
                </button>
              );
            })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-2 pb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`skeleton-hero-${index}`}
              className="rounded-[32px] bg-white/5 p-3 pb-4 animate-pulse"
            >
              <div className="h-40 rounded-[26px] bg-white/20" />
              <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 bg-white/20" />
                <div className="h-3 w-1/2 bg-white/20" />
                <div className="mt-2 flex gap-2">
                  <span className="h-9 w-9 rounded-2xl bg-white/10" />
                  <span className="h-9 w-9 rounded-2xl bg-white/10" />
                </div>
              </div>
            </div>
          ))
        ) : heroDoctors.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-[28px] border border-white/10 bg-[#0b0f1a] px-6 py-10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
            <svg
              viewBox="0 0 120 120"
              className="h-16 w-16 text-white/30"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="60" cy="60" r="42" className="text-white/15" stroke="currentColor" strokeWidth="8" />
              <path d="M40 60h40" />
              <path d="M60 40v40" />
            </svg>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white">No doctors found</p>
              <p className="text-sm text-white/60">
                Try adjusting filters or search to see more doctors near you.
              </p>
            </div>
          </div>
        ) : (
          heroDoctors.map((doctor) => (
            <div
              key={doctor.id}
              className="rounded-[32px] bg-[#191B24] p-3 pb-4"
            >
              <div className="relative h-40 overflow-hidden rounded-[26px]">
                <Image
                  src={doctor?.image}
                  alt={doctor?.name}
                  fill
                  sizes="(max-width: 1024px) 50vw, 230px"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold">
                  <Star className="h-3.5 w-3.5 fill-[#F9D655] text-[#F9D655]" />
                  {doctor.rating.toFixed(1)}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-white">{doctor.name}</p>
                <p className="text-xs text-white/50">{doctor.specialty}</p>
                <div className="mt-3 flex gap-2">
                  <RoundedIconButton>
                    <Video className="h-5 w-5" />
                  </RoundedIconButton>
                  <RoundedIconButton onClick={() => router.push(`/doctor/${doctor.id}`)}>
                    <Calendar className="h-4 w-4" />
                  </RoundedIconButton>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={sentinelRef} className="col-span-full h-1" />
      </section>

      {isLoading ? (
        <section className="flex flex-col gap-6 lg:flex-row mt-6">
          <div className="flex-1 rounded-[36px] bg-white/5 p-5 animate-pulse">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="h-28 w-28 rounded-[28px] bg-white/20" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-white/20" />
                <div className="h-3 w-1/3 bg-white/20" />
                <div className="h-3 w-1/4 bg-white/20" />
                <div className="h-3 w-full bg-white/10" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <div className="flex-1 h-10 rounded-2xl bg-white/10" />
              <div className="h-12 w-12 rounded-2xl bg-white/10" />
            </div>
          </div>
          <div className="flex-1 space-y-4 rounded-[36px] bg-white/5 p-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`skeleton-list-${idx}`}
                className="flex gap-4 rounded-[32px] bg-white/10 p-4"
              >
                <div className="h-24 w-24 rounded-[24px] bg-white/20" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 bg-white/20" />
                  <div className="h-3 w-1/2 bg-white/20" />
                  <div className="h-3 w-full bg-white/10" />
                  <div className="mt-3 flex gap-2">
                    <div className="h-9 w-20 rounded-2xl bg-white/10" />
                    <div className="h-9 w-20 rounded-2xl bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : featuredDoctor && listDoctors.length > 0 ? (
        <section className="flex flex-col gap-6 lg:flex-row mt-6">
          <div className="flex-1 rounded-[36px] bg-[#1B1C24] p-5">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative h-28 w-28 overflow-hidden rounded-[28px] border border-white/5">
                <Image
                  src={featuredDoctor?.image ?? ""}
                  alt={featuredDoctor?.name ?? ""}
                  fill
                  sizes="(max-width: 1024px) 120px, 150px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-white">
                  {featuredDoctor?.name ?? "Featured doctor"}
                </p>
                <p className="text-sm text-white/60">
                  {featuredDoctor?.specialty ?? "Specialist"}
                </p>
                <div className="mt-2 flex items-center gap-1 text-sm text-white/70">
                  <Star className="h-4 w-4 fill-[#F9D655] text-[#F9D655]" />
                  {featuredDoctor?.rating ?? 0}
                  {featuredDoctor?.reviews ? (
                    <span className="text-white/40">
                      - {featuredDoctor.reviews}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {featuredDoctor?.description ??
                    "Highlight on the newest specialist in your area."}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => router.push(`/doctor/${featuredDoctor?.id ?? ""}`)}
                className="flex-1 rounded-2xl bg-[#4D7CFF] py-3 text-sm font-semibold"
              >
                Book Now
              </button>
              <RoundedIconButton className="w-12 flex-none border border-white/15 bg-transparent">
                <Video className="h-5 w-5" />
              </RoundedIconButton>
            </div>
          </div>

          <div className="flex-1 space-y-4 rounded-[36px] bg-[#11121A] p-4">
            {listDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex gap-4 rounded-[32px] bg-[#15161E] p-4"
              >
                <div className="relative h-24 w-24 overflow-hidden rounded-[24px] border border-white/5">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="text-base font-semibold text-white">
                    {doctor.name}
                  </p>
                  <p className="text-sm text-white/60">{doctor.specialty}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm text-white/70">
                    <Star className="h-4 w-4 fill-[#F9D655] text-[#F9D655]" />
                    {doctor.rating.toFixed(1)}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-white/55">
                    {doctor.description}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => router.push(`/doctor/${doctor.id}`)}
                      className="flex-1 rounded-2xl border border-white/10 py-2 text-sm text-white/80"
                    >
                      Book Now
                    </button>
                    <RoundedIconButton>
                      <FileText className="h-4 w-4" />
                    </RoundedIconButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

  const renderTabContent = (tab: string) => {
    if (tab === "home") return renderHomeSections();
    if (tab === "chat") {
      return (
        <section className="space-y-4">
          <div className="space-y-3 rounded-[32px] border border-white/10 bg-[#11121A]/80 p-6">
            <h2 className="text-xl font-semibold text-white">Chat</h2>
            <p className="text-sm text-white/60">
              Securely message your care team and share documents instantly.
            </p>
          </div>
          <div className="rounded-[32px] bg-white/5 p-6 text-sm text-white/60">
            Conversations will appear here with typing indicators and attachments.
          </div>
        </section>
      );
    }
    if (tab === "medkey") {
      return (
        <section className="space-y-6">
          <MedKeyCard />

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Blood", value: "O+", color: "text-red-400 bg-red-400/10" },
              { label: "Height", value: "182cm", color: "text-blue-400 bg-blue-400/10" },
              { label: "Weight", value: "75kg", color: "text-orange-400 bg-orange-400/10" },
              { label: "Allergies", value: "None", color: "text-green-400 bg-green-400/10" },
            ].map((stat) => (
              <div key={stat.label} className={`flex flex-col items-center justify-center rounded-2xl border border-white/5 p-3 ${stat.color}`}>
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{stat.label}</p>
                <p className="text-sm font-bold">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#11121A]/80 p-6 md:flex md:items-center md:justify-between">
            <div className="flex flex-col md:w-1/2">
              <h2 className="text-xl font-semibold text-white">Records Vault</h2>
              <p className="text-sm text-white/60">
                Access your prescriptions, diagnostic reports, and imaging linked to your ABHA ID.
              </p>
            </div>
            <div className="mt-4 flex w-full flex-col gap-3 md:mt-0 md:w-1/2 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  placeholder="Search records..."
                  value={recordSearchQuery}
                  onChange={(e) => setRecordSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-white/5 py-3 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#4D7CFF] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Upload</span>
                <span className="md:hidden">Upload New</span>
              </button>
            </div>
          </div>

          <UploadRecordModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onUpload={(data) => {
              setUploadedRecords(prev => [data, ...prev]);
              setNotifications((prev) => [
                {
                  id: `notif-${Date.now()}`,
                  title: "Record uploaded",
                  body: `${data.title} was added to your MedKey records.`,
                  time: "Just now",
                  read: false,
                },
                ...prev,
              ]);
            }}
          />

          {/* Uploaded Records (Dynamic) */}
          {/* Uploaded Records (Dynamic) */}
          {uploadedRecords.filter(r => r.title.toLowerCase().includes(recordSearchQuery.toLowerCase())).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-medium text-white/80">Recently Uploaded</h3>
              </div>
              <div className="space-y-2">
                {uploadedRecords
                  .filter(r => r.title.toLowerCase().includes(recordSearchQuery.toLowerCase()))
                  .map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#15161E] p-4">
                      <div>
                        <p className="text-sm font-medium text-white">{rec.title}</p>
                        <p className="text-xs text-uppercase text-white/50">{rec.type.replace('_', ' ')} • {rec.date}</p>
                      </div>
                      <div className="rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-400">
                        Uploaded
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Active Prescriptions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-medium text-white/80">Active Prescriptions</h3>
              <button className="text-xs text-[#4D7CFF]">See all</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {activePrescriptions.filter(r => r.medicine.toLowerCase().includes(recordSearchQuery.toLowerCase())).map((rx) => (
                <div key={rx.id} className="rounded-[24px] border border-white/10 bg-[#15161E] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{rx.medicine}</p>
                      <p className="text-sm text-white/50">{rx.dosage}</p>
                    </div>
                    <div className="rounded-full bg-green-500/10 px-2 py-1 text-[10px] font-medium text-green-400">
                      {rx.status}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                    <span>{rx.doctor}</span>
                    <span>•</span>
                    <span>{rx.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Labs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-medium text-white/80">Recent Lab Reports</h3>
            </div>
            <div className="space-y-2">
              {recentLabs.filter(r => r.testName.toLowerCase().includes(recordSearchQuery.toLowerCase())).map((lab) => (
                <div key={lab.id} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#15161E] p-4">
                  <div>
                    <p className="text-sm font-medium text-white">{lab.testName}</p>
                    <p className="text-xs text-white/50">{lab.laboratory} • {lab.date}</p>
                  </div>
                  <div className={`rounded-full px-2 py-1 text-[10px] font-medium ${lab.status === 'Normal' ? 'bg-blue-500/10 text-blue-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {lab.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imaging */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-medium text-white/80">Imaging & Scans</h3>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {recentImaging.filter(r => r.scanType.toLowerCase().includes(recordSearchQuery.toLowerCase())).map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#15161E] p-4">
                  <div className="relative z-10">
                    <p className="font-medium text-white">{img.scanType}</p>
                    <p className="text-xs text-white/50">{img.hospital} • {img.date}</p>
                  </div>
                  <FileText className="absolute bottom-4 right-4 h-10 w-10 text-white/50 stroke-1" />
                </div>
              ))}
            </div>
          </div>

        </section>
      );
    }
    return (
      <section className="space-y-4">
        <div className="rounded-[32px] border border-white/10 bg-[#11121A]/80 p-6">
          <h2 className="text-xl font-semibold text-white">Profile</h2>
          <p className="text-sm text-white/60">
            Adjust your notifications, payment methods, and insurance details.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
              Log out
            </Button>
            <button
              type="button"
              className="text-sm text-white/60 hover:text-white"
              onClick={() => router.push("/profile")}
            >
              Edit profile
            </button>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[#15161E] p-4 text-sm text-white/70">
          Profile summary will appear here.
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-8 pb-28">
        <div
          className={`transition duration-300 ease-out ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
          key={displayedTab}
        >
          {renderTabContent(displayedTab)}
        </div>
      </div>

      <nav
        className={`fixed bottom-6 left-1/2 z-20 w-[90%] max-w-[420px] -translate-x-1/2 rounded-full px-6 py-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.4)] lg:max-w-lg ${callState === "idle"
          ? "bg-[#151621]"
          : callState === "calling"
            ? "bg-gradient-to-r from-[#0b2d5c] via-[#1c5aa7] to-[#2d7be8]"
            : "bg-gradient-to-r from-[#4b141a] via-[#7a0f1d] to-[#32090d]"
          }`}
      >
        {callState === "idle" ? (
          <div className="flex items-center justify-between">
            {navItems.map((item) => {
              const isActive = selectedTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "profile") return router.push("/profile");
                    if (item.id === "community") return router.push("/community");
                    return handleTabChange(item.id);
                  }}
                  className={`flex flex-col items-center text-xs ${isActive ? "text-white" : "text-white/50"}`}
                >
                  <item.icon
                    className={`mb-1 h-5 w-5 ${isActive ? "text-white" : "text-white/60"}`}
                  />
                  {item.label}
                </button>
              );
            })}
            <button
              className="h-12 w-12 rounded-full bg-[#FF3535] shadow-[0_15px_35px_rgba(255,53,53,0.4)] transition-colors hover:bg-[#f87171] active:bg-[#dc2626]"
              onPointerDown={(event) => {
                if (event.pointerType === "touch") return;
                event.currentTarget.setPointerCapture(event.pointerId);
                if (holdTimer.current) window.clearTimeout(holdTimer.current);
                holdTimer.current = window.setTimeout(() => {
                  setCallState("ready");
                  setSlideProgress(0);
                }, 380);
              }}
              onPointerUp={(event) => {
                if (event.pointerType === "touch") return;
                event.currentTarget.releasePointerCapture(event.pointerId);
                if (holdTimer.current) {
                  window.clearTimeout(holdTimer.current);
                  holdTimer.current = null;
                }
              }}
              onPointerLeave={() => {
                if (holdTimer.current) {
                  window.clearTimeout(holdTimer.current);
                  holdTimer.current = null;
                }
              }}
              onPointerCancel={() => {
                if (holdTimer.current) {
                  window.clearTimeout(holdTimer.current);
                  holdTimer.current = null;
                }
              }}
              onTouchStart={(event) => {
                event.preventDefault();
                if (holdTimer.current) window.clearTimeout(holdTimer.current);
                holdTimer.current = window.setTimeout(() => {
                  setCallState("ready");
                  setSlideProgress(0);
                }, 380);
              }}
              onTouchEnd={() => {
                if (holdTimer.current) {
                  window.clearTimeout(holdTimer.current);
                  holdTimer.current = null;
                }
              }}
              onTouchCancel={() => {
                if (holdTimer.current) {
                  window.clearTimeout(holdTimer.current);
                  holdTimer.current = null;
                }
              }}
            >
              <Ambulance className="mx-auto h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-center text-sm font-semibold text-white">
              {callState === "calling" ? (
                <span>
                  Calling Ambulance in 00:{String(countdown).padStart(2, "0")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  Slide to call AMBULANCE
                  <ChevronsLeft className="h-4 w-4 text-white/70" />
                </span>
              )}
            </div>
            {callState === "calling" ? (
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10"
                onClick={() => {
                  setCallState("idle");
                  setSlideProgress(0);
                }}
              >
                <X className="h-5 w-5 text-white/80" />
              </button>
            ) : (
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF3535] text-white shadow-[0_10px_25px_rgba(255,53,53,0.35)]"
                style={{ touchAction: "none" }}
                onPointerDown={(event) => {
                  if (event.pointerType === "touch") return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  startX.current = event.clientX;
                  setCallState("sliding");
                }}
                onPointerMove={(event) => {
                  if (event.pointerType === "touch") return;
                  if (callState !== "sliding") return;
                  const delta = startX.current - event.clientX;
                  const normalized = Math.max(0, Math.min(1, delta / 140));
                  setSlideProgress(normalized);
                }}
                onPointerUp={(event) => {
                  if (event.pointerType === "touch") return;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  if (slideProgress > 0.6) {
                    setCallState("calling");
                  } else {
                    setCallState("ready");
                    setSlideProgress(0);
                  }
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === "touch") return;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  if (callState === "sliding") {
                    setCallState("ready");
                    setSlideProgress(0);
                  }
                }}
                onPointerCancel={(event) => {
                  if (event.pointerType === "touch") return;
                  event.currentTarget.releasePointerCapture(event.pointerId);
                  if (callState === "sliding") {
                    setCallState("ready");
                    setSlideProgress(0);
                  }
                }}
                onTouchStart={(event) => {
                  event.preventDefault();
                  startX.current = event.touches[0]?.clientX ?? 0;
                  setCallState("sliding");
                }}
                onTouchMove={(event) => {
                  if (callState !== "sliding") return;
                  const clientX = event.touches[0]?.clientX ?? startX.current;
                  const delta = startX.current - clientX;
                  const normalized = Math.max(0, Math.min(1, delta / 140));
                  setSlideProgress(normalized);
                }}
                onTouchEnd={() => {
                  if (slideProgress > 0.6) {
                    setCallState("calling");
                  } else {
                    setCallState("ready");
                    setSlideProgress(0);
                  }
                }}
                onTouchCancel={() => {
                  if (callState === "sliding") {
                    setCallState("ready");
                    setSlideProgress(0);
                  }
                }}
              >
                <Ambulance className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
