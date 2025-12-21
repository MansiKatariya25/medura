import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

const pickPatient = (user: any) => ({
  id: String(user._id),
  name: user.fullName ?? user.name ?? "Unknown",
  meduraId: user.meduraId ?? null,
  dob: user.dob ?? null,
  gender: user.gender ?? null,
  email: user.email ?? null,
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();

  const userDoc = await db
    .collection("users")
    .findOne<{ role?: string }>(
      ObjectId.isValid(session.user.id)
        ? { _id: new ObjectId(session.user.id) }
        : { id: session.user.id },
      { projection: { role: 1 } },
    );

  if (userDoc?.role !== "doctor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const query = (searchParams.get("q") || "").trim();

  if (patientId) {
    const patientKey = ObjectId.isValid(patientId)
      ? new ObjectId(patientId)
      : patientId;
    const filter = ObjectId.isValid(patientId)
      ? { _id: new ObjectId(patientId) }
      : { _id: patientId };
    const user = await db.collection("users").findOne(filter);
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const documents = await db
      .collection("documents")
      .find({ userId: ObjectId.isValid(patientId) ? String(patientId) : patientId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    return NextResponse.json({
      patient: pickPatient(user),
      documents,
    });
  }

  if (!query) {
    return NextResponse.json({ patients: [] });
  }

  const regex = new RegExp(query, "i");
  const patients = await db
    .collection("users")
    .find({
      role: { $ne: "doctor" },
      $or: [
        { meduraId: query },
        { fullName: regex },
        { name: regex },
        { email: regex },
      ],
    })
    .limit(8)
    .toArray();

  return NextResponse.json({
    patients: patients.map(pickPatient),
  });
}
