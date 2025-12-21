import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AccessToken } from "livekit-server-sdk";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await req.json().catch(() => null);
    const roomName = typeof json?.roomName === "string" ? json.roomName : "";
    if (!roomName) {
      return NextResponse.json({ error: "Missing room" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 });
    }

    const identity = session.user.id;
    const name = session.user.name || "User";
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
    });
    token.addGrant({ roomJoin: true, room: roomName });

    return NextResponse.json({ token: token.toJwt() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Token error" },
      { status: 500 },
    );
  }
}
