/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

async function getMemberCounts(db: any, ids: string[]) {
  if (!ids.length) return new Map<string, number>();
  const counts = await db
    .collection("users")
    .aggregate([
      { $project: { communityIds: 1 } },
      { $unwind: "$communityIds" },
      { $match: { communityIds: { $in: ids } } },
      { $group: { _id: "$communityIds", count: { $sum: 1 } } },
    ])
    .toArray();

  return counts.reduce((map: Map<string, number>, item: any) => {
    map.set(item._id, item.count);
    return map;
  }, new Map<string, number>());
}

const createSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10).max(1000),
  locationName: z.string().min(2).max(200),
  latitude: z.number(),
  longitude: z.number(),
  tags: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional(),
  createdBy: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(24, Math.max(6, Number(searchParams.get("limit") || "8")));
    const query = (searchParams.get("query") || "").trim();
    const filter = (searchParams.get("filter") || "all").toLowerCase(); // "all" | "nearby"
    const lat = Number(searchParams.get("lat") || "0");
    const lng = Number(searchParams.get("lng") || "0");
    const idsParam = searchParams.get("ids");

    const client = await clientPromise;
    const db = client.db();

    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const filters = ids.map((val) => (ObjectId.isValid(val) ? new ObjectId(val) : val));
      const docs = await db
        .collection("communities")
        .find({ _id: { $in: filters } })
        .toArray();
      const memberCounts = await getMemberCounts(db, ids);
      const withCounts = docs.map((c: any) => {
        const id = c?._id?.toString?.() ?? String(c._id);
        return { ...c, members: memberCounts.get(id) ?? 0 };
      });
      return NextResponse.json({ communities: withCounts, page: 1, hasMore: false });
    }

    if (filter === "nearby" && hasCoords) {
      await db.collection("communities").createIndex({ locationCoords: "2dsphere" });
      const pipeline: any[] = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lng, lat] },
            distanceField: "distance",
            spherical: true,
            maxDistance: 40_000, // 40 km
          },
        },
      ];
      if (query) {
        pipeline.push({
          $match: {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
              { tags: { $elemMatch: { $regex: query, $options: "i" } } },
            ],
          },
        });
      }
      pipeline.push({ $sort: { distance: 1, createdAt: -1 } });
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit + 1 });

      const docs = await db.collection("communities").aggregate(pipeline).toArray();
      const hasMore = docs.length > limit;
      const slice = docs.slice(0, limit);
      const ids = slice.map((c: any) => c?._id?.toString?.() ?? String(c._id));
      const memberCounts = await getMemberCounts(db, ids);
      const withCounts = slice.map((c: any) => {
        const id = c?._id?.toString?.() ?? String(c._id);
        return { ...c, members: memberCounts.get(id) ?? 0 };
      });
      return NextResponse.json({ communities: withCounts, page, hasMore });
    }

    const filterQuery: any = {};
    if (query) {
      filterQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { tags: { $elemMatch: { $regex: query, $options: "i" } } },
      ];
    }

    const cursor = db
      .collection("communities")
      .find(filterQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit + 1);

    const docs = await cursor.toArray();
    const hasMore = docs.length > limit;
    const slice = docs.slice(0, limit);
    const ids = slice.map((c: any) => c?._id?.toString?.() ?? String(c._id));
    const memberCounts = await getMemberCounts(db, ids);
    const withCounts = slice.map((c: any) => {
      const id = c?._id?.toString?.() ?? String(c._id);
      return { ...c, members: memberCounts.get(id) ?? 0 };
    });

    return NextResponse.json({ communities: withCounts, page, hasMore });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { name, description, locationName, latitude, longitude, tags, avatarUrl, createdBy } =
      parsed.data;
    const client = await clientPromise;
    const db = client.db();

    const doc: any = {
      name,
      description,
      locationName,
      locationCoords: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      tags: tags ?? [],
      avatarUrl: avatarUrl ?? null,
      createdBy: createdBy ?? null,
      members: 1,
      nextSession: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection("communities").insertOne(doc);
    doc._id = res.insertedId;

    return NextResponse.json({ community: doc });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
