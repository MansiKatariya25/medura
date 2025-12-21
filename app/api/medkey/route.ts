import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

const generateMeduraId = () => {
  return Math.floor(10_000_000 + Math.random() * 90_000_000).toString();
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const filter = ObjectId.isValid(session.user.id)
    ? { _id: new ObjectId(session.user.id) }
    : { id: session.user.id };
  const user = await db.collection("users").findOne(filter, {
    projection: { meduraId: 1 },
  });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let meduraId = user.meduraId as string | undefined;
  if (!meduraId) {
    // simple collision-safe retry
    for (let i = 0; i < 5; i += 1) {
      const candidate = generateMeduraId();
      const exists = await db.collection("users").findOne({ meduraId: candidate }, { projection: { _id: 1 } });
      if (!exists) {
        meduraId = candidate;
        break;
      }
    }
    meduraId = meduraId || generateMeduraId();
    await db.collection("users").updateOne(filter, { $set: { meduraId } });
  }
  return NextResponse.json({ meduraId });
}
