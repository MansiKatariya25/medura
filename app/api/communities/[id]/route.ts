/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db();
    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    const doc = await db.collection("communities").findOne(filter as any);
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const idString = doc?._id?.toString?.() ?? id;
    const memberCount = await db
      .collection("users")
      .countDocuments({ communityIds: idString });
    return NextResponse.json({ community: { ...doc, members: memberCount } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json().catch(() => null);
    const membersDelta = Number(json?.membersDelta || 0);
    const userId = typeof json?.userId === "string" ? json.userId : null;
    const action = json?.action === "join" || json?.action === "leave" ? json.action : null;
    const client = await clientPromise;
    const db = client.db();
    const filter = ObjectId.isValid(id)
      ? { _id: new ObjectId(id) }
      : { _id: id };
    const update: any = { $set: { updatedAt: new Date() } };
    if (membersDelta) {
      update.$inc = { members: membersDelta };
    }
    const editableFields = ["name", "description", "locationName", "tags", "avatarUrl"];
    const hasEdits = editableFields.some((field) => json?.[field] !== undefined);
    if (hasEdits || (json?.latitude !== undefined && json?.longitude !== undefined)) {
      const existing = await db.collection("communities").findOne(filter as any, {
        projection: { createdBy: 1 },
      });
      const requesterId = typeof json?.requesterId === "string" ? json.requesterId : null;
      if (
        existing?.createdBy?.id &&
        requesterId &&
        existing.createdBy.id !== requesterId
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (json?.name) update.$set.name = json.name;
      if (json?.description) update.$set.description = json.description;
      if (json?.locationName) update.$set.locationName = json.locationName;
      if (json?.tags) update.$set.tags = json.tags;
      if (json?.avatarUrl !== undefined) update.$set.avatarUrl = json.avatarUrl;
      if (
        typeof json?.latitude === "number" &&
        typeof json?.longitude === "number"
      ) {
        update.$set.locationCoords = {
          type: "Point",
          coordinates: [json.longitude, json.latitude],
        };
      }
    }
    const res = await db.collection("communities").findOneAndUpdate(
      filter as any,
      update,
      { returnDocument: "after" }
    );
    if (!res.value) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (userId && action) {
      const userFilter = ObjectId.isValid(userId)
        ? { _id: new ObjectId(userId) }
        : { _id: userId };
      if (action === "join") {
        await db
          .collection("users")
          .updateOne(userFilter, { $addToSet: { communityIds: id } });
      } else if (action === "leave") {
        await db
          .collection("users")
          .updateOne(userFilter, { $pull: { communityIds: id } });
      }
    }

    return NextResponse.json({ community: res.value });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
