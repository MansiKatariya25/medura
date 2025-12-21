import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

const createSchema = z.object({
  title: z.string().min(2).max(120),
  url: z.string().url(),
  mimeType: z.string().max(120),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim();
  const client = await clientPromise;
  const db = client.db();
  const filter: any = { userId: session.user.id };
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { summary: { $regex: query, $options: "i" } },
    ];
  }
  const docs = await db
    .collection("documents")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return NextResponse.json({ documents: docs });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { title, url, mimeType } = parsed.data;
  if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
    return NextResponse.json({ error: "Only images or PDFs allowed" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Summarize via OpenAI if available
  let summary = "Summary not available.";
  if (process.env.OPENAI_API_KEY) {
    try {
      const userContent: any[] = [
        { type: "text", text: `Title: ${title}` },
      ];
      if (mimeType.startsWith("image/")) {
        userContent.push({ type: "image_url", image_url: { url } });
      } else {
        userContent.push({ type: "text", text: `Document URL: ${url}` });
      }
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Summarize the medical document in under 60 words. If image: read visible text. If pdf: infer from filename/URL.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) summary = text;
    } catch {
      // ignore summarization errors
    }
  }

  const doc = {
    userId: session.user.id,
    title,
    url,
    mimeType,
    summary,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("documents").insertOne(doc);
  return NextResponse.json({ document: { ...doc, _id: result.insertedId } });
}
