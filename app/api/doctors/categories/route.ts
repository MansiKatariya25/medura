/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const titleCase = (value: string) =>
  value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const rawCategories = await db
      .collection<Record<string, unknown>>("users")
      .distinct("specialization", { role: "doctor" });

    const categories = (rawCategories || [])
      .filter((value): value is string => typeof value === "string" && !!value.trim())
      .map((value) => value.trim())
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .map((value) => ({ id: value, label: titleCase(value) }));

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load categories" },
      { status: 500 }
    );
  }
}
