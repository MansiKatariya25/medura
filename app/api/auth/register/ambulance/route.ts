import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import clientPromise from "@/lib/mongodb";

const ambulanceSchema = z.object({
  ambulanceNumber: z.string().min(1).max(32),
  phoneNumber: z.string().min(8).max(20),
  riderName: z.string().min(2).max(80),
  email: z.string().email().optional(),
  password: z.string().min(8).max(72).optional(),
  location: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = ambulanceSchema.safeParse(json);
  if (!parsed.success) {
    const pwdIssue = parsed.error.issues.find((e) => e.path?.[0] === "password");
    if (pwdIssue) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const msg = parsed.error.errors
      .map((e) => {
        const path = Array.isArray(e.path) && e.path.length ? e.path.join(".") : "";
        return path ? `${path}: ${e.message}` : e.message;
      })
      .join("; ");
    return NextResponse.json({ error: msg || "Invalid input." }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // If email provided, ensure uniqueness
  let emailLower: string | null = null;
  if (parsed.data.email) emailLower = parsed.data.email.toLowerCase();

  if (emailLower) {
    const existing = await db
      .collection("users")
      .findOne({ emailLower }, { projection: { _id: 1 } });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
  }

  // Ensure ambulance number is unique
  const existingAmb = await db
    .collection("users")
    .findOne({ ambulanceNumber: parsed.data.ambulanceNumber }, { projection: { _id: 1 } });
  if (existingAmb) {
    return NextResponse.json(
      { error: "An account with this ambulance number already exists." },
      { status: 409 },
    );
  }

  const passwordHash = parsed.data.password
    ? await bcrypt.hash(parsed.data.password, 12)
    : null;

  const userDoc = {
    role: "ambulance",
    ambulanceNumber: parsed.data.ambulanceNumber,
    riderName: parsed.data.riderName,
    phoneNumber: parsed.data.phoneNumber,
    email: parsed.data.email ?? null,
    emailLower: emailLower,
    passwordHash,
    location: parsed.data.location ?? null,
    communityIds: [],
    walletBalance: 0,
    profileComplete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await db.collection("users").insertOne(userDoc);

  await db.collection("ambulances").insertOne({
    id: res.insertedId.toString(),
    riderName: parsed.data.riderName,
    ambulanceNumber: parsed.data.ambulanceNumber,
    phoneNumber: parsed.data.phoneNumber,
    emailLower,
    passwordHash,
    location: parsed.data.location ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ ok: true, userId: String(res.insertedId) });
}
