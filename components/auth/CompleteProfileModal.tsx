"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Gender = "male" | "female" | "other" | "prefer_not_say";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

export default function CompleteProfileModal({
  isOpen,
  initialFullName,
  initialDob,
  initialGender,
}: {
  isOpen: boolean;
  initialFullName: string;
  initialDob: string;
  initialGender: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialFullName);
  const [dob, setDob] = useState(initialDob);
  const [gender, setGender] = useState<Gender>(
    (initialGender as Gender) || "prefer_not_say",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(initialFullName);
    setDob(initialDob);
    setGender((initialGender as Gender) || "prefer_not_say");
  }, [initialDob, initialFullName, initialGender]);

  const canSubmit = useMemo(() => {
    return fullName.trim().length >= 2 && Boolean(dob) && Boolean(gender);
  }, [dob, fullName, gender]);

  if (!isOpen) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, dob, gender }),
      });

      const payload = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!res.ok) {
        setError(payload?.error ?? "Could not update profile.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not update profile.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#10111A] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-white">
            Complete your profile
          </h2>
          <p className="text-sm text-white/60">
            We need a few details before you continue.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            name="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Date of birth"
              name="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <Select
              label="Gender"
              name="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              options={genderOptions}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={!canSubmit || loading}
          >
            {loading ? "Saving..." : "Save & continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}

