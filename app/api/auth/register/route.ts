import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import clientPromise from "@/lib/mongodb";

const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  dob: z.string().min(8).max(32),
  gender: z.enum(["male", "female", "other", "prefer_not_say"]),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  state: z.string().min(2).max(120),
  location: z.string().optional(),
});

const doctorRegisterSchema = registerSchema.extend({
  specialization: z.string().min(2).max(80),
});

const ambulanceRegisterSchema = z.object({
  ambulanceNumber: z.string().min(1).max(32),
  phoneNumber: z.string().min(8).max(20),
  riderName: z.string().min(2).max(80),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72).optional(),
  location: z.string().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const meduraId = Math.floor(10_000_000 + Math.random() * 90_000_000).toString();

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
    role: "patient",
    name: parsed.data.fullName,
    fullName: parsed.data.fullName,
    dob: parsed.data.dob,
    gender: parsed.data.gender,
    email: parsed.data.email,
    emailLower,
    passwordHash,
    state: parsed.data.state,
    location: parsed.data.location ?? null,
    meduraId,
    communityIds: [],
    profileComplete: true,
    emailVerified: null,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, userId: String(res.insertedId) });
}
