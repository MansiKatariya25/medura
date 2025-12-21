import RoleAuthClient from "@/components/auth/RoleAuthClient";

export default async function RoleAuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: pathRole } = await params;
  const { role: queryRole } = await searchParams;
  const role = queryRole || pathRole;
  return <RoleAuthClient role={role} />;
}
