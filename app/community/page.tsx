"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, Search, Users, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { communities as seedCommunities } from "@/data/community";

export default function CommunityPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"joined" | "public">("public");
  const [communities, setCommunities] = useState(seedCommunities);
  const [joinedIds, setJoinedIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("medura:joined-communities");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "medura:joined-communities",
      JSON.stringify(joinedIds),
    );
  }, [joinedIds]);

  const listForTab = useMemo(() => {
    if (activeTab === "joined") {
      return communities.filter((community) => joinedIds.includes(community.id));
    }
    return communities.filter((community) => !joinedIds.includes(community.id));
  }, [activeTab, communities, joinedIds]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return listForTab;
    return listForTab.filter((community) =>
      `${community.name} ${community.description} ${community.tags.join(" ")}`
        .toLowerCase()
        .includes(term),
    );
  }, [listForTab, query]);

  const handleJoin = (id: string) => {
    if (joinedIds.includes(id)) return;
    setJoinedIds((prev) => [...prev, id]);
    setActiveTab("joined");
    setCommunities((prev) =>
      prev.map((community) =>
        community.id === id
          ? { ...community, members: community.members + 1 }
          : community,
      ),
    );
  };

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newTags, setNewTags] = useState("");

  const createCommunity = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const payload = {
        name: newName.trim(),
        description: newDescription.trim(),
        location: newLocation.trim(),
        tags: newTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create community");
      }

      const created = await res.json();
      setCommunities((prev) => [created, ...prev]);
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      setNewLocation("");
      setNewTags("");
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
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

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          <button
            className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold ${
              activeTab === "public"
                ? "bg-[#4D7CFF] text-white"
                : "text-white/60"
            }`}
            onClick={() => setActiveTab("public")}
          >
            Public communities
          </button>
          <button
            className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold ${
              activeTab === "joined"
                ? "bg-[#4D7CFF] text-white"
                : "text-white/60"
            }`}
            onClick={() => setActiveTab("joined")}
          >
            Joined
          </button>
        </div>

        <section className="space-y-2 rounded-[24px] border border-white/10 bg-[#11121A] p-3">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-sm text-white/50">
              {activeTab === "joined"
                ? "No joined communities yet."
                : "No public communities found."}
            </p>
          ) : (
            filtered.map((community) => {
              const joined = joinedIds.includes(community.id);
              return (
                <Link
                  key={community.id}
                  href={`/community/${community.id}`}
                  className="flex w-full items-center gap-3 rounded-[18px] px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-semibold text-white ${community.avatarColor}`}
                  >
                    {community.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      {community.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Users className="h-3.5 w-3.5" />
                      {community.members} members
                    </div>
                  </div>
                  {joined ? (
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/60">
                      Joined
                    </span>
                  ) : (
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        handleJoin(community.id);
                      }}
                      className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/60"
                    >
                      Join
                    </button>
                  )}
                </Link>
              );
            })
          )}
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Location</label>
                    <input
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="City or area"
                      className="w-full rounded-md border border-white/6 bg-transparent px-3 py-2 text-white placeholder:text-white/40 focus:outline-none"
                    />
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
                    disabled={creating}
                    className="rounded-full bg-[#0b5cff] px-4 py-2 text-sm font-semibold"
                  >
                    {creating ? "Creating..." : "Create community"}
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
