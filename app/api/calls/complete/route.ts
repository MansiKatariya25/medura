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
  const doctorId = typeof json?.doctorId === "string" ? json.doctorId : null;
  const durationSec = Number(json?.durationSec || 0);
  const pricePerMinute = Number(json?.pricePerMinute || 0);
  if (!doctorId || !Number.isFinite(durationSec) || durationSec <= 0 || pricePerMinute < 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const minutes = Math.max(1, Math.ceil(durationSec / 60));
  const amount = Math.round(pricePerMinute * minutes);

  const client = await clientPromise;
  const db = client.db();

  const userObjectId = ObjectId.isValid(session.user.id)
    ? new ObjectId(session.user.id)
    : null;

  const patient = await db
    .collection("users")
    .findOne(
      userObjectId ? { _id: userObjectId } : { id: session.user.id },
      { projection: { walletBalance: 1 } },
    );

  const currentBalance = Number(patient?.walletBalance || 0);
  if (currentBalance < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const doctorFilter = ObjectId.isValid(doctorId) ? { _id: new ObjectId(doctorId) } : { id: doctorId };

  await db.collection("users").updateOne(
    userObjectId ? { _id: userObjectId } : { id: session.user.id },
    { $inc: { walletBalance: -amount }, $set: { updatedAt: new Date() } },
  );

  await db.collection("users").updateOne(
    doctorFilter,
    { $inc: { earnings: amount }, $set: { updatedAt: new Date() } },
  );

  await db.collection("calls").insertOne({
    patientId: session.user.id,
    doctorId,
    durationSec,
    pricePerMinute,
    amount,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, amount });
}
