"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Search,
  Send,
  Users,
  Video,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import {
  communities,
  communityMessages,
  type CommunityMessage,
} from "@/data/community";

type WsStatus = "connecting" | "connected" | "disconnected";

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const community = communities.find((item) => item.id === id);

  const [joinedIds, setJoinedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("medura:joined-communities");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [messages, setMessages] = useState<CommunityMessage[]>(
    communityMessages.filter((msg) => msg.groupId === id),
  );
  const [composer, setComposer] = useState("");
  const [wsStatus, setWsStatus] = useState<WsStatus>("connecting");
  const [showInfo, setShowInfo] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const isJoined = joinedIds.includes(id);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "medura:joined-communities",
      JSON.stringify(joinedIds),
    );
  }, [joinedIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!id) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws/community`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.addEventListener("open", () => setWsStatus("connected"));
    ws.addEventListener("close", () => setWsStatus("disconnected"));
    ws.addEventListener("error", () => setWsStatus("disconnected"));
    ws.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          groupId?: string;
          author?: string;
          text?: string;
          time?: string;
        };
        if (!payload.groupId || !payload.text) return;
        if (payload.groupId !== id) return;
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            groupId: payload.groupId as string,
            author: payload.author ?? "Community",
            text: payload.text as string,
            time:
              payload.time ??
              new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
        ]);
      } catch {
        return;
      }
    });

    return () => {
      ws.close();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = () => {
    if (!community) return;
    if (!joinedIds.includes(id)) {
      setJoinedIds((prev) => [...prev, id]);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          groupId: id,
          author: "System",
          text: "You joined this community.",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  const handleSend = () => {
    if (!community) return;
    const text = composer.trim();
    if (!text) return;
    const payload = {
      groupId: id,
      author: "You",
      text,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, ...payload },
    ]);
    setComposer("");
  };

  const headerSubtitle = useMemo(() => {
    if (!community) return "";
    return `${community.members} members`;
  }, [community]);

  if (!community) {
    return (
      <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white">
        <button
          onClick={() => router.back()}
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
            onClick={() => router.back()}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
            {community.avatar}
          </div>
          <button
            className="flex-1 text-left"
            onClick={() => setShowInfo(true)}
            type="button"
          >
            <p className="text-sm font-semibold">{community.name}</p>
            <p className="text-xs text-white/50">{headerSubtitle}</p>
          </button>
          <div className="flex items-center gap-2 text-white/60">
            <button className="rounded-full border border-white/10 p-2">
              <Search className="h-4 w-4" />
            </button>
            <button className="rounded-full border border-white/10 p-2">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6">
        <section className="rounded-[20px] border border-white/10 bg-[#11121A] p-4 text-sm text-white/70">
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" />
              {community.members} members
            </span>
            <span>{community.location}</span>
            <span>{community.nextSession}</span>
          </div>
          <p className="mt-3 text-sm text-white/70">{community.description}</p>
          {!isJoined ? (
            <button
              onClick={handleJoin}
              className="mt-3 rounded-full bg-[#4D7CFF] px-4 py-2 text-xs font-semibold text-white"
            >
              Join community
            </button>
          ) : (
            <span className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
              Joined
            </span>
          )}
        </section>

        <section className="flex-1 space-y-4 rounded-[24px] border border-white/10 bg-[#0E1017] p-4 overflow-y-auto">
          {messages.map((msg) => {
            const isMine = msg.author === "You";
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-[20px] px-4 py-3 text-sm ${
                    isMine
                      ? "bg-[#1F3A67] text-white"
                      : "bg-[#1B1C24] text-white/90"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-white/50">
                    <span>{msg.author}</span>
                    <span>{msg.time}</span>
                  </div>
                  <p className="mt-2 leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </section>
      </main>

      <footer className="sticky bottom-0 border-t border-white/10 bg-[#0B0C12]/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <input
            value={composer}
            onChange={(event) => setComposer(event.target.value)}
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
        <div className="mx-auto mt-2 flex w-full max-w-5xl items-center justify-between text-[10px] text-white/40">
          <span>Live: {wsStatus}</span>
          <span>Messages are visible to joined members.</span>
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
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full text-xl font-semibold text-white ${community.avatarColor}`}
              >
                {community.avatar}
              </div>
              <h2 className="mt-4 text-xl font-semibold">{community.name}</h2>
              <p className="mt-1 text-sm text-white/50">
                {community.members} members
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
                <span className="text-white/50">{community.location}</span>
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
    </div>
  );
}
