import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const amount = Math.max(1, Number(json?.amount || 0));
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const filter = ObjectId.isValid(session.user.id)
    ? { _id: new ObjectId(session.user.id) }
    : { id: session.user.id };
  await db.collection("users").updateOne(
    filter,
    { $inc: { walletBalance: amount }, $set: { updatedAt: new Date() } },
  );
  return NextResponse.json({ ok: true, amount });
}
