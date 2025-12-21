import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import clientPromise from "@/lib/mongodb";

const doctorSchema = z.object({
  fullName: z.string().min(2).max(80),
  dob: z.string().min(8).max(32),
  specialization: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  location: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = doctorSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const emailLower = parsed.data.email.toLowerCase();
  const client = await clientPromise;
  const db = client.db();

  const existing = await db
    .collection("users")
    .findOne({ emailLower }, { projection: { _id: 1 } });

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const res = await db.collection("users").insertOne({
    role: "doctor",
    name: parsed.data.fullName,
    fullName: parsed.data.fullName,
    dob: parsed.data.dob,
    specialization: parsed.data.specialization,
    email: parsed.data.email,
    emailLower,
    passwordHash,
    location: parsed.data.location ?? null,
    communityIds: [],
    profileComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, userId: String(res.insertedId) });
}
