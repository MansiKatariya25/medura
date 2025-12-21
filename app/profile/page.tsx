"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Loader2, Camera, ArrowLeft, CalendarClock } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Doctor } from "@/types/doctor";

type Profile = {
  fullName?: string;
  dob?: string;
  gender?: "male" | "female" | "other" | "prefer_not_say" | "";
  email?: string;
  _id?: string;
  image?: string;
  specialization?: string;
  location?: string | null;
  role?: string | null;
  availabilitySlots?: { day: string; start: string; end: string; date?: string }[];
  walletBalance?: number;
  earnings?: number;
  pricePerMinute?: number;
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
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorLookup, setDoctorLookup] = useState<Record<string, Doctor>>({});

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<
    "male" | "female" | "other" | "prefer_not_say" | ""
  >("");
  const [specialization, setSpecialization] = useState("");
  const [location, setLocation] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");
  const [priceMsg, setPriceMsg] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState<string>("500");
  const [topupLoading, setTopupLoading] = useState(false);
  const [availDay, setAvailDay] = useState(() => {
    const idx = new Date().getDay();
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx];
  });
  const [availStart, setAvailStart] = useState("09:00");
  const [availEnd, setAvailEnd] = useState("17:00");
  const [savingAvail, setSavingAvail] = useState(false);
  const [availMsg, setAvailMsg] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement | null>(null);
  const profileImageKey = session?.user?.id
    ? `medura:profile-image:${session.user.id}`
    : "medura:profile-image";

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
            setSpecialization(pJson.profile.specialization ?? "");
            setLocation(pJson.profile.location ?? "");
            if (pJson.profile.image) {
              setProfileImage(pJson.profile.image);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  profileImageKey,
                  pJson.profile.image,
                );
              }
            }
            if (pJson.profile.pricePerMinute !== undefined && pJson.profile.pricePerMinute !== null) {
              setPrice(String(pJson.profile.pricePerMinute));
            }
            if (Array.isArray(pJson.profile.availabilitySlots) && pJson.profile.availabilitySlots.length > 0) {
              const slot = pJson.profile.availabilitySlots[0];
              setAvailDay(slot.day || availDay);
              setAvailStart(slot.start || "09:00");
              setAvailEnd(slot.end || "17:00");
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
  }, [profileImageKey, session?.user?.id]);

  useEffect(() => {
    if (appointments.length === 0) return;
    const ids = Array.from(
      new Set(appointments.map((a) => a.doctorId).filter(Boolean)),
    );
    if (ids.length === 0) return;
    let active = true;
    const loadDoctors = async () => {
      try {
        const results = await Promise.all(
          ids.map((id) =>
            fetch(`/api/doctors/${id}`)
              .then((r) => r.json())
              .then((data) => (data?.doctor ? data.doctor : null))
              .catch(() => null),
          ),
        );
        if (!active) return;
        const next: Record<string, Doctor> = {};
        results.forEach((doc, idx) => {
          if (doc) next[ids[idx]] = doc;
        });
        setDoctorLookup(next);
      } catch {
        // ignore
      }
    };
    loadDoctors();
    return () => {
      active = false;
    };
  }, [appointments]);

  useEffect(() => {
    if (typeof window !== "undefined" && !profileImage) {
      const saved = window.localStorage.getItem("medura:profile-image");
      if (saved) {
        setProfileImage(saved);
      }
    }
  }, [profileImage, profileImageKey]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      setImageError("Cloudinary is not configured.");
      return;
    }
    setImageError(null);
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }
      const uploadJson = await uploadRes.json();
      const imageUrl = uploadJson.secure_url || uploadJson.url;
      if (!imageUrl) {
        throw new Error("No image URL returned");
      }
      setProfileImage(imageUrl);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(profileImageKey, imageUrl);
      }
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      if (!res.ok) {
        throw new Error("Could not save profile image");
      }
      setProfile((prev) => (prev ? { ...prev, image: imageUrl } : prev));
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleTopup = async () => {
    setPriceMsg(null);
    setTopupLoading(true);
    try {
      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const ok = await loadRazorpay();
      if (!ok || !key) {
        setPriceMsg("Razorpay not available");
        return;
      }
      const amount = Number(topupAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setPriceMsg("Enter a valid amount");
        return;
      }
      const orderRes = await fetch("/api/wallet/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson?.order?.id) {
        setPriceMsg(orderJson?.error || "Could not create order");
        return;
      }
      const options = {
        key,
        amount: orderJson.order.amount,
        currency: "INR",
        order_id: orderJson.order.id,
        name: "Medura",
        description: "Wallet top-up",
        handler: async () => {
          await fetch("/api/wallet/credit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
          });
          setPriceMsg("Wallet updated");
        },
        prefill: {
          name: profile?.fullName || "",
          email: profile?.email || "",
        },
        theme: { color: "#4D7CFF" },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setPriceMsg("Payment failed");
    } finally {
      setTopupLoading(false);
    }
  };

  const savePrice = async () => {
    setPriceMsg(null);
    const num = Number(price);
    if (!Number.isFinite(num) || num < 0) {
      setPriceMsg("Enter a valid price per minute.");
      return;
    }
    try {
      const res = await fetch("/api/doctor/price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pricePerMinute: num }),
      });
      const j = await res.json();
      if (!res.ok) {
        setPriceMsg(j?.error || "Failed to save price");
        return;
      }
      setPriceMsg("Price updated");
    } catch {
      setPriceMsg("Failed to save price");
    }
  };

  const saveAvailability = async () => {
    const doctorProfileId = session?.user?.id ?? profile?._id ?? null;
    if (!profile || String(profile.role || "").toLowerCase() !== "doctor") {
      setAvailMsg("Doctor profile not loaded");
      return;
    }
    if (!doctorProfileId) {
      setAvailMsg("Doctor id is missing. Please reload and try again.");
      return;
    }
    setSavingAvail(true);
    setAvailMsg(null);
    try {
      const res = await fetch(`/api/doctors/${doctorProfileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityDays: [availDay],
          availabilitySlots: [
            { day: availDay, start: availStart, end: availEnd, date: new Date().toISOString().slice(0, 10) },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
      setAvailMsg("Availability saved");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              availabilitySlots: data.doctor?.availabilitySlots || [
                { day: availDay, start: availStart, end: availEnd },
              ],
            }
          : prev,
      );
    } catch (err: any) {
      setAvailMsg(err?.message || "Could not save availability");
    } finally {
      setSavingAvail(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          dob,
          gender,
          specialization: (session?.user as any)?.role === "doctor" ? specialization : undefined,
          location: (session?.user as any)?.role === "doctor" ? location : undefined,
        }),
      });
      const j = await res.json();
      if (j?.ok) {
        setProfile({ ...profile, fullName, dob, gender, specialization, location });
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition hover:bg-white/10"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
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
              className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-white/80 transition hover:bg-white/10"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#111317]">
                {profileImage ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${profileImage})` }}
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-white/5 to-white/2" />
                )}
                <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white">
                  <Camera className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  onClick={() => imageInput.current?.click()}
                  className="absolute inset-0 rounded-full border border-white/20 bg-black/40 text-xs opacity-0 transition hover:opacity-100"
                >
                  {uploadingImage ? "Uploading..." : "Change"}
                </button>
                {uploadingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : null}
              </div>
              <input
                ref={imageInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imageError ? (
                <p className="text-xs text-red-200">{imageError}</p>
              ) : null}
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
         
          </div>

          {/* Doctor pricing / balances */}
          {String(profile?.role || "").toLowerCase() === "doctor" ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-4 text-white">
              <h3 className="text-lg font-semibold">Video Call Pricing</h3>
              <p className="text-sm text-white/60">
                Set your price per minute for video consultations.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-40 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="₹/min"
                />
                <Button onClick={savePrice}>Save price</Button>
              </div>
              {priceMsg ? (
                <p className="mt-2 text-sm text-white/70">{priceMsg}</p>
              ) : null}
              <div className="mt-3 text-sm text-white/60">
                Earnings: ₹{profile?.earnings ?? 0}
              </div>
              <div className="mt-6 rounded-xl border border-white/10 bg-[#11121A] p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-white/70" />
                  <p className="text-sm font-semibold">Availability</p>
                </div>
                <p className="mt-1 text-xs text-white/60">
                  Set a day/time window for today (and reuse for future).
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    value={availDay}
                    onChange={(e) => setAvailDay(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                  >
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <option key={d} value={d} className="bg-[#0f1116]">
                        {d}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={availStart}
                    onChange={(e) => setAvailStart(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <input
                    type="time"
                    value={availEnd}
                    onChange={(e) => setAvailEnd(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
                  />
                  <Button onClick={saveAvailability} disabled={savingAvail}>
                    {savingAvail ? "Saving..." : "Save"}
                  </Button>
                </div>
                {availMsg ? (
                  <p className="mt-2 text-xs text-white/70">{availMsg}</p>
                ) : null}
                {profile?.availabilitySlots && profile.availabilitySlots.length > 0 ? (
                  <div className="mt-3 space-y-2 text-xs text-white/70">
                    {profile.availabilitySlots.map((slot, idx) => (
                      <div
                        key={`${slot.day}-${slot.start}-${slot.end}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <span className="font-semibold text-white">{slot.day}</span>
                        <span>
                          {slot.start} - {slot.end}
                          {slot.date ? ` • ${slot.date}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : String(profile?.role || "").toLowerCase() === "ambulance" ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-4 text-white space-y-3">
              <h3 className="text-lg font-semibold">Service Payments</h3>
              <p className="text-sm text-white/60">
                Track payouts for completed emergency services.
              </p>
              <div className="rounded-xl border border-white/10 bg-[#11121A] p-4">
                <div className="text-xs uppercase tracking-wide text-white/50">
                  Total Earnings
                </div>
                <div className="mt-2 text-2xl font-bold">
                  ₹{profile?.earnings ?? 0}
                </div>
              </div>
              <div className="text-xs text-white/50">
                Payouts are processed after service completion.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0f1116] p-4 text-white space-y-3">
              <h3 className="text-lg font-semibold">Wallet</h3>
              <p className="text-sm text-white/60">
                Balance available for video consultations.
              </p>
              <div className="text-2xl font-bold">₹{profile?.walletBalance ?? 0}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="Amount"
                />
                <Button onClick={handleTopup} disabled={topupLoading}>
                  {topupLoading ? "Processing..." : "Add money"}
                </Button>
              </div>
              {priceMsg ? (
                <p className="text-sm text-white/70">{priceMsg}</p>
              ) : null}
            </div>
          )}

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
                  {(session?.user as any)?.role === "doctor" ? (
                    <>
                      <label className="block text-sm text-white/70">
                        Specialization
                      </label>
                      <input
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                      />
                      <label className="block text-sm text-white/70">
                        Location
                      </label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-white/90"
                      />
                    </>
                  ) : null}
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
                return (
                  <div
                    key={a._id ?? a.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11121A] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        {doctorLookup[a.doctorId]?.image ? (
                          <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${doctorLookup[a.doctorId]?.image})` }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                            DR
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {doctorLookup[a.doctorId]?.name ?? "Doctor"}
                        </div>
                        <div className="text-xs text-white/50">
                          {doctorLookup[a.doctorId]?.specialty ?? "Specialist"}
                        </div>
                        <div className="text-sm text-white/60">
                          {dt ? dt.toLocaleString() : "Date pending"}
                        </div>
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
                return (
                  <div
                    key={a._id ?? a.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11121A] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                        {doctorLookup[a.doctorId]?.image ? (
                          <div
                            className="h-full w-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${doctorLookup[a.doctorId]?.image})` }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                            DR
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {doctorLookup[a.doctorId]?.name ?? "Doctor"}
                        </div>
                        <div className="text-xs text-white/50">
                          {doctorLookup[a.doctorId]?.specialty ?? "Specialist"}
                        </div>
                        <div className="text-sm text-white/60">
                          {dt ? dt.toLocaleString() : "Date pending"}
                        </div>
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
