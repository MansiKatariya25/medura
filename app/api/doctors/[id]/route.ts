/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import type { Doctor } from "@/types/doctor";

const fallbackImage =
  "https://res.cloudinary.com/demo/image/upload/v1677654321/doctor1.jpg";

const toString = (value: unknown) => (typeof value === "string" ? value : "");
const toNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const mapDoctor = (doc: Record<string, any>): Doctor => {
  const id = doc._id ? String(doc._id) : crypto.randomUUID();
  const name =
    toString(doc.fullName) ||
    toString(doc.name) ||
    toString(doc.doctorName) ||
    "Doctor";
  const specialty = toString(doc.specialization) || toString(doc.specialty) || "General";
  const rating = toNumber(doc.rating, 4.2);
  const description =
    toString(doc.description) ||
    toString(doc.bio) ||
    "Experienced specialist available for consultation.";
  const category = specialty.toLowerCase();
  const reviews = toString(doc.reviews) || undefined;
  const image = toString(doc.image) || toString(doc.avatarUrl) || fallbackImage;
  const pricePerMinute = toNumber(doc.pricePerMinute, 0);
  const availabilityDays = Array.isArray(doc.availabilityDays)
    ? (doc.availabilityDays as string[])
    : undefined;
  const availabilitySlots = Array.isArray(doc.availabilitySlots)
    ? (doc.availabilitySlots as any[]).map((s) => ({
        day: toString(s.day),
        start: toString(s.start),
        end: toString(s.end),
        date: toString(s.date) || undefined,
      }))
    : undefined;

  return {
    id,
    name,
    specialty,
    rating,
    description,
    category,
    reviews,
    image,
    pricePerMinute,
    availabilityDays,
    availabilitySlots,
  };
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const filter: any = { _id: new ObjectId(id), role: "doctor" };
    const doc = await db.collection("users").findOne(filter);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ doctor: mapDoctor(doc) });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load doctor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await req.json();
    const availabilityDays = Array.isArray(json?.availabilityDays)
      ? (json.availabilityDays as string[])
      : [];
    const availabilitySlotsRaw = Array.isArray(json?.availabilitySlots)
      ? (json.availabilitySlots as any[])
      : [];
    const availabilitySlots = availabilitySlotsRaw
      .map((slot) => ({
        day: toString(slot.day),
        start: toString(slot.start),
        end: toString(slot.end),
        date: toString(slot.date) || undefined,
      }))
      .filter((s) => s.day && s.start && s.end);

    const allowedDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const clean = availabilityDays.filter((d) => allowedDays.includes(d));

    const client = await clientPromise;
    const db = client.db();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const filter: any = { _id: new ObjectId(id), role: "doctor" };
    await db.collection("users").updateOne(filter, {
      $set: { availabilityDays: clean, availabilitySlots, updatedAt: new Date() },
    });

    const updated = await db.collection("users").findOne(filter);
    return NextResponse.json({ doctor: updated ? mapDoctor(updated) : null });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Update failed" },
      { status: 500 }
    );
  }
}
