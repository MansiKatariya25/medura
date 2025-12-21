"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function DoctorAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    // Try to populate location if available
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register/doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, dob, specialization, email, password, location }),
        });
        const payload = (await res.json().catch(() => null)) as any;
        if (!res.ok) {
          setError(payload?.error || "Signup failed");
          return;
        }
      }

      const signInRes = await signIn("credentials", { email, password, role: "doctor", redirect: false, callbackUrl: "/doctors" });
      if (signInRes?.error || !signInRes?.ok) {
        setError("Invalid credentials");
        return;
      }
      if (signInRes.url) {
        router.replace(signInRes.url);
      } else {
        router.replace("/doctors");
      }
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <Card title={mode === "signup" ? "Doctor Signup" : "Doctor Signin"}>
          <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
            <button className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold ${mode === "signin" ? "bg-white/10 text-white" : "text-white/60"}`} onClick={() => setMode("signin")}>Sign in</button>
            <button className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold ${mode === "signup" ? "bg-white/10 text-white" : "text-white/60"}`} onClick={() => setMode("signup")}>Create account</button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <>
                <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  <Input label="Specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} required />
                </div>
              </>
            ) : null}

            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
