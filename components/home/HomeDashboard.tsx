"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  MessageCircle,
  Plus,
  Search,
  Star,
  User,
  X,
  Video,
} from "lucide-react";

import { doctors } from "@/data/doctors";

type IconComponent = ComponentType<{ className?: string }>;

const categories = [
  { id: "all", label: "All Doctors", icon: HeartPulse as IconComponent },
  { id: "neuro", label: "Neurologist", icon: Brain as IconComponent },
  { id: "pediatric", label: "Pediatric", icon: Baby as IconComponent },
  { id: "general", label: "General", icon: Activity as IconComponent },
  { id: "cardio", label: "Cardiologist", icon: HeartPulse as IconComponent },
];

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "records", label: "Records", icon: FileText },
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
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-[#202331] text-white ${className}`}
    >
      {children}
    </span>
  );
}

export default function HomeDashboard({ userName }: { userName: string }) {
  const locationLabel = useLocationLabel();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("home");
  const [displayedTab, setDisplayedTab] = useState("home");
  const [transitioning, setTransitioning] = useState(false);
  const [callState, setCallState] = useState<
    "idle" | "ready" | "sliding" | "calling"
  >("idle");
  const [slideProgress, setSlideProgress] = useState(0);
  const [countdown, setCountdown] = useState(10);
  const holdTimer = useRef<number | null>(null);
  const startX = useRef(0);
  const countdownRef = useRef<number | null>(null);
  const readyTimeout = useRef<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
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

  const visibleDoctors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered =
      activeCategory === "all"
        ? doctors
        : doctors.filter((doc) => doc.category === activeCategory);

    if (!query) return filtered;
    return filtered.filter((doc) =>
      `${doc.name} ${doc.specialty}`.toLowerCase().includes(query),
    );
  }, [activeCategory, searchQuery]);

  const heroDoctors = visibleDoctors.slice(0, 4);
  const featuredDoctor = visibleDoctors[0];
  const listDoctors = visibleDoctors.slice(4);

  const renderHomeSections = () => (
    <>
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white">
            <Image
              src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80"
              alt={userName}
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">{userName} 👋</p>
            <p className="text-sm text-white/70">Good afternoon</p>
          </div>
          <button className="rounded-full border border-white/20 bg-white/25 p-3 text-white/70">
            <Bell className="h-4 w-4 text-white" />
          </button>
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

        <section className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Doctors Category</h2>
            <button className="text-sm text-gray-500 transition-colors hover:text-gray-400">
              See all
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                  key={`skeleton-chip-${index}`}
                  className="h-8 w-24 rounded-4xl bg-white/10 animate-pulse"
                />
              ))
            : categories.map((category) => {
                const CategoryIcon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex shrink-0 items-center gap-1 rounded-4xl px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-white/35 text-white"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    <CategoryIcon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{category.label}</span>
                  </button>
                );
              })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mt-2 pb-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
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
          : heroDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="rounded-[32px] bg-[#191B24] p-3 pb-4"
              >
                <div className="relative h-40 overflow-hidden rounded-[26px]">
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
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
                    <RoundedIconButton>
                      <Calendar className="h-4 w-4" />
                    </RoundedIconButton>
                  </div>
                </div>
              </div>
            ))}
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
      ) : (
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
              <button className="flex-1 rounded-2xl bg-[#4D7CFF] py-3 text-sm font-semibold">
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
                    <button className="flex-1 rounded-2xl border border-white/10 py-2 text-sm text-white/80">
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
      )}
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
    if (tab === "records") {
      return (
        <section className="space-y-4">
          <div className="rounded-[32px] border border-white/10 bg-[#11121A]/80 p-6">
            <h2 className="text-xl font-semibold text-white">Records</h2>
            <p className="text-sm text-white/60">
              Vault your prescriptions, imaging, and lab reports in one place.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {["Prescriptions", "Labs", "Imaging"].map((label) => (
              <div
                key={label}
                className="rounded-[24px] border border-white/10 bg-[#15161E] p-4 text-sm text-white/70"
              >
                {label} overview placeholder.
              </div>
            ))}
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
        className={`fixed bottom-6 left-1/2 z-20 w-[90%] max-w-[420px] -translate-x-1/2 rounded-full px-6 py-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.4)] lg:max-w-lg ${
          callState === "idle"
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
                  onClick={() => handleTabChange(item.id)}
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
              <Plus className="mx-auto h-5 w-5" />
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
