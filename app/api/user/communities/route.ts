import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ communityIds: [] }, { status: 401 });
    }
    const userId = session.user.id;
    const client = await clientPromise;
    const db = client.db();
    const filter = ObjectId.isValid(userId)
      ? { _id: new ObjectId(userId) }
      : { id: userId };
    const user = await db.collection("users").findOne<{ communityIds?: string[] }>(filter, {
      projection: { communityIds: 1 },
    });
    return NextResponse.json({ communityIds: user?.communityIds ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
