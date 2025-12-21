import RoleAuthClient from "@/components/auth/RoleAuthClient";

export default async function RoleAuthPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  return <RoleAuthClient role={role} />;
}
