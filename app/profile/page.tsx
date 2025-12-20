"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { doctors } from "@/data/doctors";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male"|"female"|"other"|"prefer_not_say"|"">("");
  const [showAccount, setShowAccount] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

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

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, dob, gender }) });
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
  const upcoming = appointments.filter(a => a.appointmentDate ? new Date(a.appointmentDate).getTime() >= now : true);
  const past = appointments.filter(a => a.appointmentDate ? new Date(a.appointmentDate).getTime() < now : false);

  return (
    <div className="min-h-screen bg-[#05060B] px-4 py-6 text-white lg:px-10 lg:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-full border border-white/20 bg-white/5 p-3 text-white/70"
              aria-label="Go back"
            >
              ←
            </button>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => signOut({ callbackUrl: "/" })} className="rounded-full bg-white/6 px-3 py-1 text-sm font-semibold">Logout</button>
          </div>
        </div>

        <div className="rounded-xl bg-[#0f1116] p-6">
          <div className="mx-auto max-w-2xl">
            <div className="relative flex items-center gap-4">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#111317]">
                <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/2" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-lg font-semibold">{profile?.fullName ?? 'Your name'}</p>
                    <p className="text-sm text-white/60">{profile?.email ?? ''}</p>
                    {profile?.dob ? <p className="text-xs text-white/50">DOB: {profile.dob}</p> : null}
                  </div>
                  <div className="ml-auto">
                    <button onClick={() => setShowAccount(true)} className="rounded-full bg-white/6 px-3 py-1 text-sm font-semibold">Edit</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-white/6 pt-4">
              <h2 className="text-sm font-semibold text-white mb-3">Profile Controls</h2>
              <div className="space-y-3">
                <button onClick={() => { setShowAccount((s)=>!s); setShowSecurity(false); }} className="w-full rounded-xl bg-[#070913] p-4 text-left flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Account Information</div>
                    <div className="text-sm text-white/60">Edit personal details</div>
                  </div>
                  <div className="text-white/40">{showAccount ? '˅' : '›'}</div>
                </button>
                {showAccount ? (
                  <div className="rounded-lg bg-[#06070a] p-4">
                    <label className="block text-sm text-white/70">Full name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-white/90" />
                    <div className="mt-3">
                      <label className="block text-sm text-white/70">Date of birth</label>
                      <input type="date" value={dob} onChange={(e)=> setDob(e.target.value)} className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-white/90" />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button disabled={saving} onClick={saveProfile} className="rounded-2xl bg-[#0b5cff] px-4 py-2 font-semibold">{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => setShowAccount(false)} className="rounded-2xl border px-4 py-2">Close</button>
                    </div>
                  </div>
                ) : null}

                <button onClick={() => { setShowSecurity((s)=>!s); setShowAccount(false); }} className="w-full rounded-xl bg-[#070913] p-4 text-left flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Security Settings</div>
                    <div className="text-sm text-white/60">Update password</div>
                  </div>
                  <div className="text-white/40">{showSecurity ? '˅' : '›'}</div>
                </button>
                {showSecurity ? (
                  <div className="rounded-lg bg-[#06070a] p-4">
                    <label className="block text-sm text-white/70">Current password</label>
                    <input type="password" value={currentPassword} onChange={(e)=> setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-white/90" />
                    <label className="block text-sm text-white/70 mt-3">New password</label>
                    <input type="password" value={newPassword} onChange={(e)=> setNewPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-white/90" />
                    <label className="block text-sm text-white/70 mt-3">Confirm new password</label>
                    <input type="password" value={confirmPassword} onChange={(e)=> setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-white/90" />
                    {pwMsg ? <div className="mt-2 text-sm text-white/70">{pwMsg}</div> : null}
                    <div className="mt-4 flex gap-2">
                      <button onClick={async ()=>{
                        setPwMsg(null);
                        if (!currentPassword || !newPassword) { setPwMsg('Fill all fields'); return; }
                        if (newPassword !== confirmPassword) { setPwMsg('Passwords do not match'); return; }
                        try {
                          const res = await fetch('/api/profile/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) });
                          const j = await res.json();
                          if (!res.ok) throw new Error(j?.error || 'Failed');
                          setPwMsg('Password updated');
                          setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
                        } catch (err:any) {
                          setPwMsg(err?.message ?? 'Error');
                        }
                      }} className="rounded-2xl bg-[#0b5cff] px-4 py-2 font-semibold">Change password</button>
                      <button onClick={() => setShowSecurity(false)} className="rounded-2xl border px-4 py-2">Close</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Upcoming Appointments</h2>
          {loading ? <div className="text-white/60">Loading...</div> : (
            upcoming.length === 0 ? <div className="text-white/60">No upcoming appointments.</div> : (
              <div className="space-y-3">
                {upcoming.map(a => {
                  const dt = a.appointmentDate ? new Date(a.appointmentDate) : new Date(a.createdAt);
                  const doc = doctors.find(d => d.id === a.doctorId);
                  return (
                    <div key={a._id ?? a.id} className="rounded-lg border bg-[#11121A] p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{doc?.name ?? a.doctorId}</div>
                        <div className="text-sm text-white/60">{dt.toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-white/70">{a.status}</div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Previous Appointments</h2>
          {loading ? <div className="text-white/60">Loading...</div> : (
            past.length === 0 ? <div className="text-white/60">No previous appointments.</div> : (
              <div className="space-y-3">
                {past.map(a => {
                  const dt = a.appointmentDate ? new Date(a.appointmentDate) : new Date(a.createdAt);
                  const doc = doctors.find(d => d.id === a.doctorId);
                  return (
                    <div key={a._id ?? a.id} className="rounded-lg border bg-[#11121A] p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{doc?.name ?? a.doctorId}</div>
                        <div className="text-sm text-white/60">{dt.toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-white/70">{a.status}</div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
