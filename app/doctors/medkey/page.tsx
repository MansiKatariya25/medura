"use client";

import { useEffect, useState } from "react";
import { Search, FileText, User, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type PatientSummary = {
  id: string;
  name: string;
  meduraId: string | null;
  dob: string | null;
  gender: string | null;
  email: string | null;
};

type PatientDetail = PatientSummary & {
  documents: {
    _id?: string;
    id?: string;
    title?: string;
    summary?: string;
    summaryTitle?: string;
    url?: string;
    mimeType?: string;
    createdAt?: string;
  }[];
};

export default function DoctorMedKey() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSummary[]>([]);
  const [selected, setSelected] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as any)?.role;
    if (role && role !== "doctor") {
      router.replace("/home");
    }
  }, [router, session?.user, status]);

  const handleSearch = async () => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setSelected(null);
      setError(null);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/medkey/doctor-search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Search failed");
        setResults([]);
        return;
      }
      setResults(data?.patients || []);
      if ((data?.patients || []).length === 0) {
        setError("No MedKey found for this patient.");
      } else {
        setError(null);
      }
    } catch {
      setError("Search failed");
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch();
    }, 400);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const loadDetails = async (patientId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/medkey/doctor-search?patientId=${patientId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to load MedKey details");
        return;
      }
      setSelected({ ...(data.patient || {}), documents: data.documents || [] });
      setError(null);
    } catch {
      setError("Unable to load MedKey details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelect = (patient: PatientSummary) => {
    setSelected(null);
    loadDetails(patient.id);
  };

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-24">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">MedKey (Doctor)</h1>
            <p className="text-sm text-white/60">
              Search a patient MedKey to review history and documents.
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter MedKey ID or patient name"
                className="w-full rounded-full bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            {searchLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white/60" />
            ) : null}
            <button
              onClick={() => setQuery("")}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
            >
              Clear
            </button>
          </div>
          {error ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : null}
          {results.length > 0 ? (
            <div className="mt-4 space-y-2">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
                >
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-white/50">{p.meduraId ?? "No MedKey"}</p>
                  </div>
                  <span className="text-xs text-white/60">{p.gender ?? "Unknown"}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {detailLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading MedKey details...
          </div>
        ) : null}

        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <User className="h-6 w-6 text-white/70" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <p className="text-xs text-white/50">
                    {selected.gender ?? "Unknown"} • {selected.dob ?? "DOB not set"}
                  </p>
                  <p className="text-xs text-white/50">MedKey: {selected.meduraId ?? "Not assigned"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Documents & Reports</h3>
                <span className="text-xs text-white/50">{selected.documents.length} files</span>
              </div>
              <div className="mt-3 space-y-3">
                {selected.documents.map((doc) => (
                  <div
                    key={String(doc._id || doc.id)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#11121A] p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold">{doc.title || doc.summaryTitle || "Document"}</p>
                        <p className="text-xs text-white/50">
                          {doc.mimeType || "Unknown"} • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ""}
                        </p>
                        {doc.summary ? (
                          <p className="text-xs text-white/60 mt-1">{doc.summary}</p>
                        ) : null}
                      </div>
                    </div>
                    <a
                      href={doc.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={`rounded-full border border-white/10 px-3 py-1 text-xs text-white/70 ${
                        doc.url ? "hover:bg-white/10" : "pointer-events-none opacity-50"
                      }`}
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
