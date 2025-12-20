"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Search,
  Send,
  Users,
  Video,
  Loader2,
  MapPin,
  Crosshair,
  LogOut,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Community = {
  _id?: string;
  name: string;
  description: string;
  tags?: string[];
  members?: number;
  locationName?: string;
  nextSession?: string;
  avatarUrl?: string | null;
  createdBy?: { id: string; name: string } | null;
};

type CommunityMessage = {
  _id?: string;
  id?: string;
  communityId: string;
  authorId?: string | null;
  authorName: string;
  text: string;
  createdAt?: string;
};

type WsStatus = "connecting" | "connected" | "disconnected";

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: session } = useSession();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [composer, setComposer] = useState("");
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const [showInfo, setShowInfo] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editCoords, setEditCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [editSuggestions, setEditSuggestions] = useState<
    { id: string; description: string; latitude: number | null; longitude: number | null }[]
  >([]);
  const [editLoadingSuggest, setEditLoadingSuggest] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isJoined = joinedIds.includes(id);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const dateRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollRafRef = useRef<number | null>(null);
  const [currentDateLabel, setCurrentDateLabel] = useState("Today");
  const sentMessageIdsRef = useRef<Set<string>>(new Set());

  const currentUserName = session?.user?.name || "You";

  useEffect(() => {
    if (!session?.user?.id) return;
    (async () => {
      try {
        const res = await fetch("/api/user/communities");
        if (!res.ok) return;
        const data = await res.json();
        const ids = (data?.communityIds || []).map((v: string) => String(v));
        if (ids.length) {
          setJoinedIds((prev) => Array.from(new Set([...prev, ...ids])));
        }
      } catch {
        // ignore
      }
    })();
  }, [session?.user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("medura:joined-communities");
      if (raw) {
        setJoinedIds(JSON.parse(raw) as string[]);
      }
    } catch {
      setJoinedIds([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "medura:joined-communities",
        JSON.stringify(joinedIds),
      );
    } catch {
      // ignore
    }
  }, [joinedIds]);

  const fetchCommunity = useCallback(async () => {
    if (!id) return;
    setLoadingCommunity(true);
    try {
      const res = await fetch(`/api/communities/${id}`);
      if (!res.ok) {
        setCommunity(null);
        return;
      }
      const data = await res.json();
      setCommunity(data?.community || null);
    } catch {
      setCommunity(null);
    } finally {
      setLoadingCommunity(false);
    }
  }, [id]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/communities/${id}/messages?page=1&limit=30`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data?.messages || []);
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCommunity();
    fetchMessages();
  }, [fetchCommunity, fetchMessages]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!id) return;
    const url =
      process.env.NEXT_PUBLIC_WS_URL ||
      `${window.location.protocol === "https:" ? "wss" : "ws"}://${
        window.location.host
      }/ws/community`;
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.addEventListener("open", () => {
        setWsStatus("connected");
        ws.send(
          JSON.stringify({
            type: "identify",
            userId: session?.user?.id || "anon",
            userName: currentUserName,
          }),
        );
        ws.send(
          JSON.stringify({
            type: "join",
            groupId: id,
          }),
        );
      });
      ws.addEventListener("close", () => setWsStatus("disconnected"));
      ws.addEventListener("error", () => setWsStatus("disconnected"));
      ws.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            type?: string;
            groupId?: string;
            from?: string;
            text?: string;
            time?: number;
            authorId?: string | null;
          };
          if (payload.groupId !== id) return;
            if (payload.type === "message" && payload.text) {
              if (payload.messageId && sentMessageIdsRef.current.has(payload.messageId)) {
                return;
              }
              if (payload.from && payload.from === currentUserName) {
                return;
              }
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg-${Date.now()}`,
                  communityId: id,
                  authorName: payload.from || "Member",
                  authorId: payload.authorId || null,
                  text: payload.text,
                  createdAt: payload.time
                    ? new Date(payload.time).toISOString()
                    : undefined,
                },
              ]);
            }
          } catch {
          // ignore
        }
      });

      return () => {
        ws.close();
      };
    } catch {
      setWsStatus("disconnected");
    }
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = async () => {
    if (!community || isJoined) return;
    setJoinedIds((prev) => [...prev, id]);
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        communityId: id,
        authorName: "System",
        text: "You joined this community.",
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membersDelta: 1,
          action: "join",
          userId: session?.user?.id ? String(session.user.id) : null,
        }),
      });
      fetchCommunity();
    } catch {
      // ignore
    }
  };

  const handleLeave = async () => {
    if (!community || !isJoined) return;
    setJoinedIds((prev) => prev.filter((item) => item !== id));
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        communityId: id,
        authorName: "System",
        text: "You left this community.",
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membersDelta: -1,
          action: "leave",
          userId: session?.user?.id ? String(session.user.id) : null,
        }),
      });
      fetchCommunity();
    } catch {
      // ignore
    }
  };

  const isOwner =
    Boolean(session?.user?.id) && community?.createdBy?.id === session?.user?.id;

  useEffect(() => {
    if (!community) return;
    setEditName(community.name || "");
    setEditDescription(community.description || "");
    setEditTags((community.tags || []).join(", "));
    setEditLocation(community.locationName || "");
    setEditAvatarUrl(community.avatarUrl || "");
    if (community.locationName) {
      setEditCoords(null);
    }
  }, [community]);

  useEffect(() => {
    const controller = new AbortController();
    const handler = setTimeout(() => {
      if (!editLocation.trim()) {
        setEditSuggestions([]);
        return;
      }
      setEditLoadingSuggest(true);
      fetch(`/api/communities/location?q=${encodeURIComponent(editLocation)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => setEditSuggestions(data?.suggestions || []))
        .catch(() => setEditSuggestions([]))
        .finally(() => setEditLoadingSuggest(false));
    }, 350);
    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [editLocation]);

  const fillCurrentLocation = async () => {
    if (!coords) return;
    setEditCoords(coords);
    try {
      const res = await fetch(
        `/api/location/reverse?lat=${coords.lat}&lng=${coords.lng}`
      );
      const data = await res.json();
      if (data?.label) {
        setEditLocation(data.label);
      } else {
        setEditLocation("Current location");
      }
    } catch {
      setEditLocation("Current location");
    }
    setEditSuggestions([]);
  };

  const saveEdits = async () => {
    if (!community) return;
    setEditError(null);
    if (!editName.trim()) {
      setEditError("Community name is required.");
      return;
    }
    if (editDescription.trim().length < 10) {
      setEditError("Description should be at least 10 characters.");
      return;
    }
    const payload: any = {
      requesterId: session?.user?.id ? String(session.user.id) : undefined,
      name: editName.trim(),
      description: editDescription.trim(),
      tags: editTags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean),
      avatarUrl: editAvatarUrl.trim() || null,
    };
    if (editLocation.trim()) {
      payload.locationName = editLocation.trim();
    }
    if (editCoords) {
      payload.latitude = editCoords.lat;
      payload.longitude = editCoords.lng;
    }
    try {
      const res = await fetch(`/api/communities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => null);
        throw new Error(errPayload?.error || "Failed to update community");
      }
      const data = await res.json();
      setCommunity(data?.community || community);
      setShowEdit(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleSend = async () => {
    if (!community) return;
    const text = composer.trim();
    if (!text) return;
    const messageId = `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    sentMessageIdsRef.current.add(messageId);
    const payload = {
      communityId: id,
      authorName: currentUserName,
      authorId: session?.user?.id ? String(session.user.id) : null,
      text,
      createdAt: new Date().toISOString(),
    };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "message",
          groupId: id,
          text,
          messageId,
          authorId: session?.user?.id ? String(session.user.id) : null,
        })
      );
    }
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, ...payload }]);
    setComposer("");
    try {
      await fetch(`/api/communities/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          authorName: currentUserName,
          authorId: session?.user?.id ? String(session.user.id) : null,
        }),
      });
    } catch {
      // ignore
    }
  };

  const headerSubtitle = useMemo(() => {
    if (!community) return "";
    return `${community.members ?? 0} members`;
  }, [community]);

  const getDateLabel = (value?: string) => {
    if (!value) return "Today";
    const msgDate = new Date(value);
    const today = new Date();
    const msgKey = msgDate.toDateString();
    const todayKey = today.toDateString();
    if (msgKey === todayKey) return "Today";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (msgKey === yesterday.toDateString()) return "Yesterday";
    return msgDate.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const updateCurrentDateLabel = useCallback(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop + 6;
    const labels = Object.keys(dateRefs.current);
    if (labels.length === 0) {
      setCurrentDateLabel("Today");
      return;
    }
    let active = labels[0] || "Today";
    labels.forEach((label) => {
      const node = dateRefs.current[label];
      if (node && node.offsetTop <= scrollTop) {
        active = label;
      }
    });
    setCurrentDateLabel(active);
  }, []);

  useEffect(() => {
    updateCurrentDateLabel();
  }, [messages, updateCurrentDateLabel]);

  if (!community && !loadingCommunity) {
    return (
      <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white">
        <button
          onClick={() => router.push("/community")}
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
        >
          Back to communities
        </button>
        <p className="mt-6 text-sm text-white/60">
          Community not found.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#05060B] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0C12]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <button
            onClick={() => router.push("/community")}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-semibold">
            {community?.avatarUrl ? (
              <img
                src={community.avatarUrl}
                alt={community?.name || "Community"}
                className="h-full w-full object-cover"
              />
            ) : (
              (community?.name || "").slice(0, 2).toUpperCase()
            )}
          </div>
          <button
            className="flex-1 text-left"
            onClick={() => setShowInfo(true)}
            type="button"
          >
            <p className="text-sm font-semibold">
              {community?.name ?? "Loading..."}
            </p>
            <p className="text-xs text-white/50">{headerSubtitle}</p>
          </button>
          <div className="flex items-center gap-2 text-white/60">
            <button className="rounded-full border border-white/10 p-2">
              <Search className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                className="rounded-full border border-white/10 p-2"
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu ? (
                <div className="absolute right-0 top-11 z-30 min-w-[160px] rounded-2xl border border-white/10 bg-[#0B0C12] p-2 text-sm text-white shadow-xl">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleLeave();
                      router.push("/community");
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-white/80 hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" />
                    Exit community
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        <section
          ref={chatScrollRef}
          onScroll={() => {
            if (scrollRafRef.current) return;
            scrollRafRef.current = window.requestAnimationFrame(() => {
              scrollRafRef.current = null;
              updateCurrentDateLabel();
            });
          }}
          className="flex-1 space-y-4 rounded-[24px] border border-white/10 bg-[#0E1017] px-4 pb-4 pt-10 overflow-y-auto"
        >
        <div className="sticky top-2 z-20 flex items-center justify-center -translate-y-6 pointer-events-none">
          <span className="rounded-full border border-white/15 bg-[#0B0C12]/85 px-3 py-1 text-[11px] text-white/70 backdrop-blur">
            {currentDateLabel || "Today"}
          </span>
        </div>
          {loadingMessages ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={`msg-skel-${idx}`} className="flex justify-start">
                <div className="h-16 w-2/3 rounded-2xl bg-white/10 animate-pulse" />
              </div>
            ))
          ) : (
            (() => {
              let lastLabel = "";
              return messages.flatMap((msg) => {
                const label = getDateLabel(msg.createdAt);
                const showLabel = label !== lastLabel;
                lastLabel = label;
                const isMine =
                  (msg.authorId &&
                    session?.user?.id &&
                    String(msg.authorId) === String(session.user.id)) ||
                  msg.authorName === currentUserName;
                const time = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return [
                  showLabel && label !== currentDateLabel ? (
                    <div
                      key={`date-${msg.id || msg._id}`}
                      ref={(node) => {
                        dateRefs.current[label] = node;
                      }}
                      className="flex items-center justify-center py-2"
                    >
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
                        {label}
                      </span>
                    </div>
                  ) : null,
                  <div
                    key={msg.id || msg._id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[78%] rounded-[20px] px-4 py-3 text-sm ${
                        isMine
                          ? "bg-[#1F3A67] text-white"
                          : "bg-[#1B1C24] text-white/90"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] text-white/50">
                        <span className="truncate">
                          {isMine ? "You" : msg.authorName}
                        </span>
                        {time ? (
                          <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur">
                            {time}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 leading-relaxed">{msg.text}</p>
                    </div>
                  </div>,
                ].filter(Boolean);
              });
            })()
          )}
          <div ref={bottomRef} />
        </section>
      </main>

      <footer className="sticky bottom-0 border-t border-white/10 bg-[#0B0C12]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <input
            value={composer}
            onChange={(event) => setComposer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isJoined
                ? "Type a message"
                : "Join the community to send updates"
            }
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/30 focus:outline-none"
            disabled={!isJoined}
          />
          <button
            onClick={handleSend}
            disabled={!isJoined}
            className="rounded-full bg-[#4D7CFF] p-2 text-white disabled:bg-white/10"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {showInfo ? (
        <div className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-2xl flex-col bg-[#0B0C12] px-6 py-5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowInfo(false)}
                className="rounded-full border border-white/10 p-2 text-white/70"
                aria-label="Close group info"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold text-white">Group info</p>
              <span className="h-8 w-8" />
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4D7CFF] to-[#7C3AED] text-xl font-semibold text-white">
                {community?.avatarUrl ? (
                  <img
                    src={community.avatarUrl}
                    alt={community.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (community?.name || "").slice(0, 2).toUpperCase()
                )}
              </div>
              <h2 className="mt-4 text-xl font-semibold">{community.name}</h2>
              <p className="mt-1 text-sm text-white/50">
                {community.members ?? 0} members
              </p>
              <p className="mt-3 max-w-md text-sm text-white/70">
                {community.description}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                Add members
              </button>
              <button className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                Search
              </button>
            </div>

            <div className="mt-6 space-y-4 border-t border-white/10 pt-5 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Location</span>
                <span className="text-white/50">{community.locationName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Next session</span>
                <span className="text-white/50">{community.nextSession}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {community.tags.map((tag) => (
                  <span
                    key={`${community.id}-${tag}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/40">
              <span>Media, links and docs</span>
              <span>25</span>
            </div>
          </div>
        </div>
      ) : null}

      {showEdit ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#071021] p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Edit Community</h2>
                <p className="text-sm text-white/60">Update community info and profile image.</p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="rounded-full p-1 text-white/60 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-xs text-white/60">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="mb-1 block text-xs text-white/60">Location</label>
                  <div className="relative">
                    <input
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
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
                  {editLoadingSuggest ? (
                    <div className="absolute right-3 top-8 text-white/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : null}
                  {editSuggestions.length > 0 && (
                    <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/10 bg-[#0B0C12] shadow-lg">
                      {editSuggestions.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5"
                          onClick={() => {
                            setEditLocation(s.description);
                            if (s.latitude !== null && s.longitude !== null) {
                              setEditCoords({ lat: s.latitude, lng: s.longitude });
                            } else {
                              fetch(`/api/communities/geocode?q=${encodeURIComponent(s.description)}`)
                                .then((res) => res.json())
                                .then((data) => {
                                  if (data?.location?.latitude && data?.location?.longitude) {
                                    setEditCoords({
                                      lat: data.location.latitude,
                                      lng: data.location.longitude,
                                    });
                                  }
                                })
                                .catch(() => null);
                            }
                            setEditSuggestions([]);
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
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">Profile image URL (optional)</label>
                <input
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>

              {editError ? (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {editError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveEdits}
                  className="rounded-full bg-[#0b5cff] px-4 py-2 text-sm font-semibold"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
