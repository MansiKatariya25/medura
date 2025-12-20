import { NextResponse } from "next/server";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const bodySchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10).max(1000),
  location: z.string().min(2).max(200),
  tags: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const items = await db
      .collection("communities")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ ok: true, communities: items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, description, location, tags } = parsed.data;
    const client = await clientPromise;
    const db = client.db();

    const doc: any = {
      name,
      description,
      location,
      tags: tags ?? [],
      members: 1,
      nextSession: null,
      createdAt: new Date(),
    };

    const res = await db.collection("communities").insertOne(doc);
    doc._id = res.insertedId;

    return NextResponse.json({ ok: true, community: doc });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
