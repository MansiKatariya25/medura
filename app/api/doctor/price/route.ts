import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const doctor = await db
    .collection("doctors")
    .findOne({ id: session.user.id }, { projection: { pricePerMinute: 1 } });
  return NextResponse.json({ pricePerMinute: doctor?.pricePerMinute ?? 0 });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const price = Number(json?.pricePerMinute);
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  await db.collection("doctors").updateOne(
    { id: session.user.id },
    { $set: { pricePerMinute: price, updatedAt: new Date() } },
    { upsert: true },
  );
  await db.collection("users").updateOne(
    { _id: new ObjectId(session.user.id) },
    { $set: { pricePerMinute: price, updatedAt: new Date() } },
  );
  return NextResponse.json({ ok: true, pricePerMinute: price });
}
