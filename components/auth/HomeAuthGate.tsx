"use client";

import { useSession } from "next-auth/react";

import AuthScreen from "@/components/auth/AuthScreen";
import CompleteProfileModal from "@/components/auth/CompleteProfileModal";
import HomeDashboard from "@/components/home/HomeDashboard";
import HomeDashboardSkeleton from "@/components/home/HomeDashboardSkeleton";

export default function HomeAuthGate() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <HomeDashboardSkeleton />;
  }

  if (!session) return <AuthScreen />;

  const userName =
    session.user.fullName ?? session.user.name ?? session.user.email ?? "Hi";

  return (
    <>
      <HomeDashboard userName={userName} />
      <CompleteProfileModal
        isOpen={!session.user.profileComplete}
        initialFullName={session.user.fullName ?? session.user.name ?? ""}
        initialDob={session.user.dob ?? ""}
        initialGender={session.user.gender ?? ""}
      />
    </>
  );
}
