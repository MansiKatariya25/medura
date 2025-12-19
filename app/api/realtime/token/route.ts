/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const tokenCache: {
  value: string | null;
  expiresAt: number;
  inFlight: Promise<string> | null;
} = {
  value: null,
  expiresAt: 0,
  inFlight: null,
};

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing on server" },
        { status: 500 }
      );
    }

    const now = Date.now();
    if (tokenCache.value && tokenCache.expiresAt && now < tokenCache.expiresAt) {
      return NextResponse.json({ client_secret: { value: tokenCache.value } });
    }

    if (tokenCache.inFlight) {
      const value = await tokenCache.inFlight;
      return NextResponse.json({ client_secret: { value } });
    }

    tokenCache.inFlight = (async () => {
      const realtimeModel = process.env.REALTIME_MODEL || "gpt-realtime-mini";
      const voice = process.env.REALTIME_VOICE || "verse";
      const sessionPayload = {
        session: {
          type: "realtime",
          model: realtimeModel,
          audio: {
            output: {
              voice,
            },
          },
        },
      };

      const response = await fetch(
        "https://api.openai.com/v1/realtime/client_secrets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "realtime=v1",
          },
          body: JSON.stringify(sessionPayload),
        }
      );

      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || "Token request failed");
      }

      let parsed: any = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }
      const value = parsed?.client_secret?.value || parsed?.value;
      if (!value) {
        throw new Error("Token response missing value");
      }

      tokenCache.value = value;
      tokenCache.expiresAt = Date.now() + 45_000;
      return value;
    })();

    try {
      const value = await tokenCache.inFlight;
      return NextResponse.json({ client_secret: { value } });
    } finally {
      tokenCache.inFlight = null;
    }
  } catch (error: any) {
    tokenCache.inFlight = null;
    return NextResponse.json(
      { error: error?.message || "Token endpoint error" },
      { status: 503 }
    );
  }
}
