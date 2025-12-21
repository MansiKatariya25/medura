/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { Doctor } from "@/types/doctor";

export const dynamic = "force-dynamic";

const fallbackImage =
  "https://res.cloudinary.com/demo/image/upload/v1677654321/doctor1.jpg";

const toString = (value: unknown) => (typeof value === "string" ? value : "");
const toNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(
      24,
      Math.max(4, Number(searchParams.get("limit") || "8"))
    );
    const category = (searchParams.get("category") || "").trim();
    const query = (searchParams.get("query") || "").trim();

    const client = await clientPromise;
    const db = client.db();
    const filter: Record<string, any> = {};
    if (category && category !== "all") {
      filter.specialization = { $regex: `^${category}$`, $options: "i" };
    }
    if (query) {
      filter.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
        { specialization: { $regex: query, $options: "i" } },
      ];
    }

    const docs = await db
      .collection<Record<string, unknown>>("users")
      .find({ ...filter, role: "doctor" })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const doctors: Doctor[] = docs.map((doc) => {
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
      const reviews = toString(doc.reviews);
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
        reviews: reviews || undefined,
        image,
        pricePerMinute,
        availabilityDays,
        availabilitySlots,
      };
    });

    const hasMore = docs.length === limit;

    return NextResponse.json({ doctors, hasMore, page });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load doctors" },
      { status: 500 }
    );
  }
}
