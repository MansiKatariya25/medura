import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

const bodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const client = await clientPromise;
    const db = client.db();

    const userId = session.user.id;
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const storedHash = user.passwordHash ?? user.password_hash ?? null;
    if (!storedHash) {
      return NextResponse.json({ error: "No password set" }, { status: 400 });
    }

    const ok = await bcrypt.compare(currentPassword, storedHash);
    if (!ok) return NextResponse.json({ error: "Current password incorrect" }, { status: 403 });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { passwordHash: newHash } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
