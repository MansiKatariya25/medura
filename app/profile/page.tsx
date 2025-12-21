"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { doctors } from "@/data/doctors";

type Profile = {
  fullName?: string;
  dob?: string;
  gender?: "male" | "female" | "other" | "prefer_not_say" | "";
  email?: string;
  image?: string;
};

type Appointment = {
  _id?: string;
  id?: string;
  doctorId: string;
  appointmentDate?: string;
  createdAt?: string;
  status?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<
    "male" | "female" | "other" | "prefer_not_say" | ""
  >("");
  const [showAccount, setShowAccount] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/appointments"),
        ]);
        const pJson = await pRes.json();
        if (pJson?.ok) {
          setProfile(pJson.profile);
          if (pJson.profile) {
            setFullName(pJson.profile.fullName ?? "");
            setDob(pJson.profile.dob ?? "");
            setGender(pJson.profile.gender ?? "");
            if (pJson.profile.image) {
              setProfileImage(pJson.profile.image);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  "medura:profile-image",
                  pJson.profile.image,
                );
              }
            }
          }
        }
        const aJson = await aRes.json();
        if (aJson?.ok) {
          setAppointments(aJson.appointments ?? []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !profileImage) {
      const saved = window.localStorage.getItem("medura:profile-image");
      if (saved) {
        setProfileImage(saved);
      }
    }
  }, [profileImage]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setProfileImage(result);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("medura:profile-image", result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, dob, gender }),
      });
      const j = await res.json();
      if (j?.ok) {
        setProfile({ ...profile, fullName, dob, gender });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const now = Date.now();
  const upcoming = appointments.filter((a) =>
    a.appointmentDate ? new Date(a.appointmentDate).getTime() >= now : true,
  );
  const past = appointments.filter((a) =>
    a.appointmentDate ? new Date(a.appointmentDate).getTime() < now : false,
  );

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/20 bg-white/5 p-3 text-white/70"
              aria-label="Go back"
            >
              &lt;
            </button>
            <div>
              <h1 className="text-xl font-semibold">Profile</h1>
              <p className="text-sm text-white/60">
                Manage your account details
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80"
          >
            Logout
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#111317]">
                {profileImage ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${profileImage})` }}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/2" />
                )}
                <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white">
                  +
                </div>
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className="absolute inset-0 rounded-full border border-white/20 bg-black/40 text-xs opacity-0 transition hover:opacity-100"
                >
                  Change
                </button>
              </div>
              <input
                ref={imageInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <div>
                <p className="text-lg font-semibold">
                  {profile?.fullName ?? "Your name"}
                </p>
                <p className="text-sm text-white/60">{profile?.email ?? ""}</p>
                {profile?.dob ? (
                  <p className="text-xs text-white/50">DOB: {profile.dob}</p>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2 lg:ml-auto">
              <button
                onClick={() => setShowAccount(true)}
                className="rounded-full bg-[#0b5cff] px-4 py-2 text-sm font-semibold text-white"
              >
                Edit profile
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#0b0d13] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Account Information</div>
                  <div className="text-sm text-white/60">
                    Edit personal details
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAccount((s) => !s);
                    setShowSecurity(false);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                >
                  {showAccount ? "Hide" : "Edit"}
                </button>
              </div>
              {showAccount ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm text-white/70">
                    Full name
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                  />
                  <div>
                    <label className="block text-sm text-white/70">
                      Date of birth
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={saving}
                      onClick={saveProfile}
                      className="rounded-2xl bg-[#0b5cff] px-4 py-2 text-sm font-semibold text-white"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setShowAccount(false)}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0b0d13] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">Security Settings</div>
                  <div className="text-sm text-white/60">Update password</div>
                </div>
                <button
                  onClick={() => {
                    setShowSecurity((s) => !s);
                    setShowAccount(false);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                >
                  {showSecurity ? "Hide" : "Edit"}
                </button>
              </div>
              {showSecurity ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm text-white/70">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                  />
                  <label className="block text-sm text-white/70">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                  />
                  <label className="block text-sm text-white/70">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                  />
                  {pwMsg ? (
                    <div className="text-sm text-white/70">{pwMsg}</div>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        setPwMsg(null);
                        if (!currentPassword || !newPassword) {
                          setPwMsg("Fill all fields");
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setPwMsg("Passwords do not match");
                          return;
                        }
                        try {
                          const res = await fetch("/api/profile/password", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ currentPassword, newPassword }),
                          });
                          const j = await res.json();
                          if (!res.ok) throw new Error(j?.error || "Failed");
                          setPwMsg("Password updated");
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        } catch (err: unknown) {
                          const message =
                            err instanceof Error ? err.message : "Error";
                          setPwMsg(message);
                        }
                      }}
                      className="rounded-2xl bg-[#0b5cff] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Change password
                    </button>
                    <button
                      onClick={() => setShowSecurity(false)}
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <h2 className="text-lg font-semibold mb-3">Upcoming Appointments</h2>
          {loading ? (
            <div className="text-white/60">Loading...</div>
          ) : upcoming.length === 0 ? (
            <div className="text-white/60">No upcoming appointments.</div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((a) => {
                const dt = a.appointmentDate
                  ? new Date(a.appointmentDate)
                  : a.createdAt
                    ? new Date(a.createdAt)
                    : null;
                const doc = doctors.find((d) => d.id === a.doctorId);
                return (
                  <div
                    key={a._id ?? a.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11121A] p-3"
                  >
                    <div>
                      <div className="font-semibold">
                        {doc?.name ?? a.doctorId}
                      </div>
                      <div className="text-sm text-white/60">
                        {dt ? dt.toLocaleString() : "Date pending"}
                      </div>
                    </div>
                    <div className="text-sm text-white/70">{a.status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f1116] p-5">
          <h2 className="text-lg font-semibold mb-3">Previous Appointments</h2>
          {loading ? (
            <div className="text-white/60">Loading...</div>
          ) : past.length === 0 ? (
            <div className="text-white/60">No previous appointments.</div>
          ) : (
            <div className="space-y-3">
              {past.map((a) => {
                const dt = a.appointmentDate
                  ? new Date(a.appointmentDate)
                  : a.createdAt
                    ? new Date(a.createdAt)
                    : null;
                const doc = doctors.find((d) => d.id === a.doctorId);
                return (
                  <div
                    key={a._id ?? a.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11121A] p-3"
                  >
                    <div>
                      <div className="font-semibold">
                        {doc?.name ?? a.doctorId}
                      </div>
                      <div className="text-sm text-white/60">
                        {dt ? dt.toLocaleString() : "Date pending"}
                      </div>
                    </div>
                    <div className="text-sm text-white/70">{a.status}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
