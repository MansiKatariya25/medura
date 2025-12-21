/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(10, Number(searchParams.get("limit") || "20")));

    const client = await clientPromise;
    const db = client.db();
    const filter = { communityId: id };

    const cursor = db
      .collection("community_messages")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1);

    const docs = await cursor.toArray();
    const hasMore = docs.length > limit;
    const slice = docs.slice(0, limit).reverse(); // newest last

    return NextResponse.json({ messages: slice, page, hasMore });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const text = typeof json?.text === "string" ? json.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Message text required" }, { status: 400 });
    }
    const authorId = typeof json?.authorId === "string" ? json.authorId : null;
    const authorName = typeof json?.authorName === "string" ? json.authorName : "Anonymous";

    const client = await clientPromise;
    const db = client.db();

    const doc: any = {
      communityId: id,
      authorId,
      authorName,
      text,
      createdAt: new Date(),
    };

    const res = await db.collection("community_messages").insertOne(doc);
    doc._id = res.insertedId;

    return NextResponse.json({ message: doc });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
