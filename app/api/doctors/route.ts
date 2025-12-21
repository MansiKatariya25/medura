/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import type { Doctor } from "@/schemas/doctor";

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
      filter.category = category;
    }
    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { specialty: { $regex: query, $options: "i" } },
        { specialization: { $regex: query, $options: "i" } },
      ];
    }

    const docs = await db
      .collection<Record<string, unknown>>("doctors")
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const doctors: Doctor[] = docs.map((doc) => {
      const id =
        toString(doc.id) ||
        (doc._id ? String(doc._id) : "") ||
        crypto.randomUUID();
      const name =
        toString(doc.name) ||
        toString(doc.fullName) ||
        toString(doc.doctorName) ||
        "Doctor";
      const specialty =
        toString(doc.specialty) ||
        toString(doc.specialization) ||
        "General";
      const rating = toNumber(doc.rating, 4.2);
      const description =
        toString(doc.description) ||
        toString(doc.bio) ||
        "Experienced specialist available for consultation.";
      const category = toString(doc.category) || specialty.toLowerCase();
      const reviews = toString(doc.reviews);
      const image = toString(doc.image) || toString(doc.avatarUrl) || fallbackImage;
      const cloudinaryId = toString(doc.cloudinaryId) || undefined;
      const pricePerMinute = toNumber(doc.pricePerMinute, 0);

      return {
        id,
        name,
        specialty,
        rating,
        description,
        category,
        reviews: reviews || undefined,
        image,
        cloudinaryId,
        pricePerMinute,
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
