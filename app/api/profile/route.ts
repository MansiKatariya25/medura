import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const patchSchema = z.object({
  fullName: z.string().min(2).max(80).optional(),
  dob: z.string().min(8).max(32).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_say"]).optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (parsed.data.fullName) {
    updates.fullName = parsed.data.fullName;
    updates.name = parsed.data.fullName;
  }
  if (parsed.data.dob) updates.dob = parsed.data.dob;
  if (parsed.data.gender) updates.gender = parsed.data.gender;

  const profileComplete =
    Boolean(updates.fullName) &&
    Boolean(updates.dob) &&
    Boolean(updates.gender);

  if (profileComplete) updates.profileComplete = true;

  const client = await clientPromise;
  const db = client.db();

  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: updates },
  );

  return NextResponse.json({ ok: true });
}
