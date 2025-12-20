import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  doctorId: z.string().min(1),
  slot: z.string().min(1), // e.g. "01:00 PM"
  date: z.string().optional(), // ISO date
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const { doctorId, slot, notes, date } = parsed.data;

    const client = await clientPromise;
    const db = client.db();

    let appointmentDate: Date | null = null;
    if (date) {
      try {
        appointmentDate = new Date(date);
        if (Number.isNaN(appointmentDate.getTime())) appointmentDate = null;
      } catch {
        appointmentDate = null;
      }
    }

    const appointment: any = {
      doctorId,
      slot,
      notes: notes ?? null,
      appointmentDate: appointmentDate ?? null,
      createdAt: new Date(),
      status: "booked",
    };

    if (session?.user?.id) {
      appointment.userId = session.user.id;
      appointment.userName = session.user.name ?? null;
      appointment.userEmail = session.user.email ?? null;
    }

    const res = await db.collection("appointments").insertOne(appointment);

    return NextResponse.json({ ok: true, id: String(res.insertedId) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db();

    const userId = session.user.id;
    const items = await db
      .collection("appointments")
      .find({ userId: userId })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, appointments: items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
