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
  let summaryTitle = "Document";
  if (process.env.OPENAI_API_KEY) {
    try {
      const userContent: any[] = [{ type: "text", text: `File name: ${title}` }];
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
              "You are a medical document summarizer. Respond ONLY with compact JSON: {\"title\": string, \"summary\": string}. Keep summary <= 60 words. If data missing, use concise placeholders.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        response_format: { type: "json_object" },
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
      if (text) {
        try {
          const parsed = JSON.parse(text);
          summary = parsed.summary || summary;
          summaryTitle = parsed.title || summaryTitle;
        } catch {
          summary = text;
        }
      }
    } catch {
      // ignore summarization errors
    }
  }

  const doc = {
    userId: session.user.id,
    title,
    summaryTitle,
    url,
    mimeType,
    summary,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection("documents").insertOne(doc);
  return NextResponse.json({ document: { ...doc, _id: result.insertedId } });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const id = typeof json?.id === "string" ? json.id : null;
  if (!id) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const filter = {
    _id: ObjectId.isValid(id) ? new ObjectId(id) : id,
    userId: session.user.id,
  };
  const res = await db.collection("documents").deleteOne(filter);
  if (res.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
