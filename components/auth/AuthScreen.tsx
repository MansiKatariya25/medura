"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type Mode = "signin" | "signup";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState(genderOptions[0]!.value);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState("");
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const subtitle = useMemo(() => {
    if (mode === "signup") {
      return "Create your Medura account in under a minute.";
    }
    return "Sign in to continue to your dashboard.";
  }, [mode]);

  // helper to allow ambulance and doctor quick access from landing
  const goToDoctor = () => router.push('/auth/doctor');
  const goToAmbulance = () => router.push('/auth/ambulance');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, dob, gender, email, password, state, location }),
        });

        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!res.ok) {
          setError(payload?.error ?? "Sign up failed. Please try again.");
          return;
        }
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        role: "patient",
        redirect: false,
        callbackUrl: "/home",
      });

      if (signInRes?.error || !signInRes?.ok) {
        setError("Invalid email or password.");
        return;
      }

      if (signInRes.url) {
        router.replace(signInRes.url);
      } else {
        router.replace("/home");
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-8">
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide text-white/70">
            MEDURA
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </p>
          <p className="mt-2 text-sm text-white/60">{subtitle}</p>
        </div>

        <Card
          title={mode === "signup" ? "Sign up" : "Sign in"}
          description="Secure access with your email and password."
        >
          <div className="flex gap-2 rounded-2xl bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "signin"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition-colors ${
                mode === "signup"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mt-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <>
                  <Input
                    label="Full name"
                    name="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
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
                  onChange={(e) => setGender(e.target.value)}
                  options={genderOptions}
                />
              </div>
              <Input
                label="State"
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Your state"
                required
              />
                </>
              ) : null}

              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                required
              />

              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
