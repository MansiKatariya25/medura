/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { sdp?: string; model?: string; ephemeralKey?: string }
      | null;

    const sdp = body?.sdp;
    const model = body?.model;
    const ephemeralKey = body?.ephemeralKey;

    if (!sdp || typeof sdp !== "string") {
      return NextResponse.json({ error: "Missing sdp in body" }, { status: 400 });
    }

    const authKey = ephemeralKey || process.env.OPENAI_API_KEY;
    if (!authKey) {
      return NextResponse.json(
        { error: "Missing auth key (ephemeralKey or OPENAI_API_KEY)" },
        { status: 400 }
      );
    }

    const realtimeModel =
      model || process.env.REALTIME_MODEL || "gpt-realtime-mini";

    const response = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
        realtimeModel
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authKey}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1",
        },
        body: sdp,
      }
    );

    const text = await response.text();
    if (!response.ok) {
      return new NextResponse(text || "SDP negotiation failed", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Session endpoint error" },
      { status: 500 }
    );
  }
}
