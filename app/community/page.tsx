"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Search, Users, Plus, MapPin, Loader2, Crosshair } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Community = {
  _id?: string;
  name: string;
  description: string;
  tags?: string[];
  members?: number;
  locationName?: string;
  locationCoords?: { type: "Point"; coordinates: [number, number] };
};

type Suggestion = {
  id: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
};

export default function CommunityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"joined" | "public">("public");
  const [displayedTab, setDisplayedTab] = useState<"joined" | "public">(
    "public"
  );
  const [transitioning, setTransitioning] = useState(false);
  const [tabDirection, setTabDirection] = useState<"left" | "right">("right");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("medura:joined-communities");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "nearby">("all");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch("/api/user/communities");
        if (!res.ok) return;
        const data = await res.json();
        const serverIds = (data?.communityIds || []).map((v: string) => String(v));
        if (!serverIds.length) return;
        setJoinedIds((prev) => Array.from(new Set([...prev, ...serverIds])));
        const missing = serverIds.filter(
          (id: string) => !communities.some((c) => String(c._id) === id),
        );
        if (missing.length) {
          const res2 = await fetch(`/api/communities?ids=${missing.join(",")}`);
          const data2 = await res2.json().catch(() => null);
          if (data2?.communities?.length) {
            setCommunities((prev) => {
              const existingIds = new Set(prev.map((c) => String(c._id)));
              const additions = data2.communities.filter(
                (c: Community) => !existingIds.has(String(c._id)),
              );
              return [...additions, ...prev];
            });
          }
        }
      } catch {
        // ignore
      }
    })();
  }, [session?.user?.id, communities]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "medura:joined-communities",
      JSON.stringify(joinedIds),
    );
  }, [joinedIds]);


  const loadCommunities = async (reset = false) => {
    if (loadingMore) return;
    if (!hasMore && !reset) return;
    if (reset) {
      setPage(1);
      setHasMore(true);
    }
    const nextPage = reset ? 1 : page + 1;
    setLoading(reset);
    setLoadingMore(!reset);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: "8",
        query,
        filter,
      });
      if (filter === "nearby" && coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      }
      const res = await fetch(`/api/communities?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      const newItems: Community[] = data?.communities || [];
      setCommunities((prev) => (reset ? newItems : [...prev, ...newItems]));
      setHasMore(Boolean(data?.hasMore));
      setPage(nextPage);
    } catch {
      // ignore errors
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCommunities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, coords?.lat, coords?.lng]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadCommunities();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadCommunities]);

  const listForTab = useMemo(() => {
    if (displayedTab === "joined") {
      return communities.filter((community) =>
        joinedIds.includes(String(community._id)),
      );
    }
    return communities.filter(
      (community) => !joinedIds.includes(String(community._id)),
    );
  }, [communities, displayedTab, joinedIds]);

  const filtered = useMemo(() => listForTab, [listForTab]);

  const joinedCount = joinedIds.length;
  const publicCount = Math.max(
    0,
    communities.filter(
      (community) => !joinedIds.includes(String(community._id)),
    ).length,
  );

  const handleJoin = async (id: string) => {
    if (joinedIds.includes(id)) return;
    const userId = session?.user?.id ? String(session.user.id) : null;
    setJoinedIds((prev) => [...prev, id]);
    setCommunities((prev) =>
      prev.map((community) =>
        String(community._id) === id
          ? { ...community, members: (community.members ?? 0) + 1 }
          : community,
      ),
    );
    try {
      const payload: Record<string, unknown> = { membersDelta: 1 };
      if (userId) {
        payload.userId = userId;
        payload.action = "join";
      }
      await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // best-effort
    }
    setActiveTab("joined");
  };

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [newTags, setNewTags] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (!newAvatarFile) {
      setNewAvatarPreview(null);
      return;
    }
    const preview = URL.createObjectURL(newAvatarFile);
    setNewAvatarPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [newAvatarFile]);

  const uploadCommunityImage = async () => {
    if (!newAvatarFile) return undefined;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing.");
    }
    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", newAvatarFile);
    formData.append("upload_preset", uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );
    const data = await res.json().catch(() => null);
    setUploadingImage(false);
    if (!res.ok) {
      throw new Error(data?.error?.message || "Image upload failed");
    }
    return data?.secure_url as string | undefined;
  };

  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      if (!newLocation.trim()) {
        setSuggestions([]);
        return;
      }
      setSuggestLoading(true);
      fetch(`/api/communities/location?q=${encodeURIComponent(newLocation)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setSuggestions(data?.suggestions || []))
        .catch(() => setSuggestions([]))
        .finally(() => setSuggestLoading(false));
    }, 350);
    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [newLocation]);

  const fillCurrentLocation = async () => {
    if (!coords) return;
    setNewCoords(coords);
    try {
      const res = await fetch(
        `/api/location/reverse?lat=${coords.lat}&lng=${coords.lng}`
      );
      const data = await res.json();
      if (data?.label) {
        setNewLocation(data.label);
      } else {
        setNewLocation("Current location");
      }
    } catch {
      setNewLocation("Current location");
    }
    setSuggestions([]);
  };

  const createCommunity = async () => {
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError("Community name is required.");
      return;
    }
    if (newDescription.trim().length < 10) {
      setCreateError("Description should be at least 10 characters.");
      return;
    }
    if (!newLocation.trim()) {
      setCreateError("Please select a location.");
      return;
    }
    if (!newCoords) {
      setCreateError("Please choose a location from suggestions.");
      return;
    }
    setCreating(true);
    try {
      const avatarUrl = await uploadCommunityImage();
      const payload = {
        name: newName.trim(),
        description: newDescription.trim(),
        locationName: newLocation.trim(),
        latitude: newCoords.lat,
        longitude: newCoords.lng,
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        avatarUrl,
        createdBy: session?.user?.id
          ? { id: String(session.user.id), name: session.user.name || "Member" }
          : undefined,
      };

      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(errPayload?.error || "Failed to create community");
      }

      const created = await res.json();
      setCommunities((prev) => [created.community, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewLocation("");
      setNewCoords(null);
      setNewTags("");
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      setCreateError(null);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create community");
    } finally {
      setCreating(false);
      setUploadingImage(false);
    }
  };

  const handleTabChange = (tab: "joined" | "public") => {
    if (tab === activeTab) return;
    setTabDirection(tab === "joined" ? "right" : "left");
    setActiveTab(tab);
    setTransitioning(true);
    window.setTimeout(() => {
      setDisplayedTab(tab);
      setTransitioning(false);
    }, 220);
  };

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/home")}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                  Community
                </p>
                <h1 className="text-xl font-semibold">
                  Health Awareness Groups
                </h1>
                <p className="text-sm text-white/60">
                  Tap a group to open the full chat and updates.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreate(true)}
                aria-label="Create community"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/90 hover:bg-white/6"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <Search className="h-4 w-4 text-white/60" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search communities"
            className="min-w-[220px] flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <div className="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          <div
            className={`absolute inset-y-1 w-[calc(50%-6px)] rounded-full bg-[#4D7CFF] transition-transform duration-300 ${activeTab === "joined" ? "translate-x-[calc(100%+6px)]" : "translate-x-0"
              }`}
          />
          <button
            className={`relative z-10 flex-1 rounded-full px-4 py-2 text-xs font-semibold ${activeTab === "public" ? "text-white" : "text-white/60"
              }`}
            onClick={() => handleTabChange("public")}
          >
            <span className="inline-flex items-center gap-2">
              Public communities
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/15 px-1 text-[10px] text-white/80">
                {publicCount}
              </span>
            </span>
          </button>
          <button
            className={`relative z-10 flex-1 rounded-full px-4 py-2 text-xs font-semibold ${activeTab === "joined" ? "text-white" : "text-white/60"
              }`}
            onClick={() => handleTabChange("joined")}
          >
            <span className="inline-flex items-center gap-2">
              Joined
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/15 px-1 text-[10px] text-white/80">
                {joinedCount}
              </span>
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
          <span className="text-white/50">Filter</span>
          <button
            className={`rounded-full px-3 py-1 transition ${filter === "all"
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white"
              }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`flex items-center gap-1 rounded-full px-3 py-1 transition ${filter === "nearby"
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white"
              }`}
            onClick={() => setFilter("nearby")}
          >
            <MapPin className="h-3.5 w-3.5" />
            Nearby
          </button>
          {filter === "nearby" && !coords ? (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-white/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              locating...
            </span>
          ) : null}
        </div>

        <section className="space-y-2 rounded-3xl border border-white/10 bg-[#11121A] p-3">
          <div
            className={`transition-all duration-300 ${transitioning
                ? tabDirection === "right"
                  ? "opacity-0 translate-x-6"
                  : "opacity-0 -translate-x-6"
                : "opacity-100 translate-x-0"
              }`}
          >
            {loading && communities.length === 0 ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`community-skeleton-${idx}`}
                  className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3"
                >
                  <div className="h-11 w-11 rounded-full bg-white/10 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 rounded bg-white/10 animate-pulse" />
                    <div className="h-3 w-1/5 rounded bg-white/10 animate-pulse" />
                  </div>
                  <div className="h-6 w-14 rounded-full bg-white/10 animate-pulse" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-sm text-white/50">
                {displayedTab === "joined"
                  ? "No joined communities yet."
                  : "No public communities found."}
              </p>
            ) : (
              filtered.map((community) => {
                const id = String(community._id);
                const joined = joinedIds.includes(id);
                return (
                  <Link
                    key={id}
                    href={`/community/${id}`}
                    className="flex w-full items-center gap-3 rounded-[18px] px-3 py-1 text-left transition hover:bg-white/5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4D7CFF] to-[#7C3AED] text-[11px] font-semibold text-white">
                      {community.avatarUrl ? (
                        <img
                          src={community.avatarUrl}
                          alt={community.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        community.name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {community.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-white/50">
                        <Users className="h-3.5 w-3.5" />
                        {(() => {
                          const count = community.members ?? 0;
                          if (count <= 1) return "New";
                          return String(count);
                        })()}
                        {community.locationName ? (
                          <span className="flex min-w-0 items-center gap-1 text-white/40">
                            <MapPin className="h-3 w-3" />
                            <span className="max-w-[140px] truncate">
                              {community.locationName?.slice(0, 15)}...
                            </span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {joined ? (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60">
                        Joined
                      </span>
                    ) : (
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          handleJoin(id);
                        }}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/60"
                      >
                        Join
                      </button>
                    )}
                  </Link>
                );
              })
            )}
            <div ref={sentinelRef} className="h-4 w-full" />
            {loadingMore ? (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more...
              </div>
            ) : null}
          </div>
        </section>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-[#071021] p-6 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Create Community</h2>
                  <p className="text-sm text-white/60">Create a community for local health awareness.</p>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                  className="ml-4 rounded-full p-1 text-white/60 hover:text-white"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCommunity();
                }}
                className="mt-4 grid gap-4"
              >
                <div>
                  <label className="mb-1 block text-xs text-white/60">Name</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Community name"
                    className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short description"
                    rows={3}
                    className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>

                <div className="gap-3">
                  <div className="relative">
                    <label className="mb-1 block text-xs text-white/60">Location</label>
                    <div className="relative">
                      <input
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="Search location"
                        className="w-full rounded-md border border-white/6 bg-transparent px-10 py-2 text-white placeholder:text-white/40 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={fillCurrentLocation}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                        aria-label="Use current location"
                      >
                        <Crosshair className="h-4 w-4" />
                      </button>
                    </div>
                    {suggestLoading ? (
                      <div className="absolute right-3 top-8 text-white/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : null}
                    {suggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/10 bg-[#0B0C12] shadow-lg">
                        {suggestions.map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                            onClick={() => {
                              setNewLocation(s.description);
                              if (s.latitude !== null && s.longitude !== null) {
                                setNewCoords({ lat: s.latitude, lng: s.longitude });
                              } else {
                                fetch(`/api/communities/geocode?q=${encodeURIComponent(s.description)}`)
                                  .then((res) => res.json())
                                  .then((data) => {
                                    if (data?.location?.latitude && data?.location?.longitude) {
                                      setNewCoords({
                                        lat: data.location.latitude,
                                        lng: data.location.longitude,
                                      });
                                    }
                                  })
                                  .catch(() => null);
                              }
                              setSuggestions([]);
                            }}
                          >
                            <MapPin className="h-4 w-4 text-white/60" />
                            <span>{s.description}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Tags</label>
                    <input
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="e.g. yoga, diabetes"
                      className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-white/60">Community image</label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-[#11131A]">
                      {newAvatarPreview ? (
                        <img
                          src={newAvatarPreview}
                          alt="Community preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                          Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          setNewAvatarFile(event.target.files?.[0] ?? null)
                        }
                        className="w-full text-xs text-white/60 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                      />
                      <p className="mt-1 text-[11px] text-white/40">
                        PNG or JPG. Uploads to Cloudinary.
                      </p>
                    </div>
                  </div>
                </div>

                {createError ? (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {createError}
                  </div>
                ) : null}

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || uploadingImage}
                    className="rounded-full bg-[#0b5cff] px-4 py-2 text-sm font-semibold"
                  >
                    {uploadingImage
                      ? "Uploading..."
                      : creating
                        ? "Creating..."
                        : "Create community"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}