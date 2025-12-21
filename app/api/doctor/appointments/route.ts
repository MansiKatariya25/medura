import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { doctors } from "@/data/doctors";

const findDoctorId = (name?: string | null) => {
  if (!name) return null;
  const normalized = name.trim().toLowerCase();
  const match = doctors.find(
    (doc) => doc.name.toLowerCase() === normalized,
  );
  return match?.id ?? null;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db();

    const filter = ObjectId.isValid(userId)
      ? { _id: new ObjectId(userId) }
      : { id: userId };

    const user = await db.collection("users").findOne<{
      role?: string;
      doctorId?: string;
      name?: string;
    }>(filter, { projection: { role: 1, doctorId: 1, name: 1 } });

    if (user?.role !== "doctor") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    let doctorId = user?.doctorId ?? null;
    if (!doctorId) {
      doctorId = findDoctorId(user?.name ?? null);
      if (doctorId) {
        await db.collection("users").updateOne(filter, {
          $set: { doctorId },
        });
      }
    }

    if (!doctorId) {
      return NextResponse.json({ ok: true, appointments: [] });
    }

    const items = await db
      .collection("appointments")
      .find({ doctorId })
      .sort({ appointmentDate: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, appointments: items, doctorId });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
