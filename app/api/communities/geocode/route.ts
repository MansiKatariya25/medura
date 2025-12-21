import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const apiKey = process.env.OLA_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OLA_MAPS_API_KEY" },
        { status: 500 }
      );
    }
    if (!q.trim()) {
      return NextResponse.json({ location: null });
    }

    const url = `https://api.olamaps.io/places/v1/geocode?address=${encodeURIComponent(
      q
    )}&api_key=${apiKey}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return NextResponse.json({ location: null });
    }
    const data = (await res.json()) as any;
    const first =
      data?.results?.[0] ||
      data?.geocodingResults?.[0] ||
      data?.data?.[0] ||
      data?.addresses?.[0] ||
      data?.place ||
      null;

    const lat =
      first?.geometry?.location?.lat ??
      first?.location?.lat ??
      first?.lat ??
      null;
    const lng =
      first?.geometry?.location?.lng ??
      first?.location?.lng ??
      first?.lng ??
      null;

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ location: null });
    }

    return NextResponse.json({
      location: {
        latitude: lat,
        longitude: lng,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to geocode" },
      { status: 500 }
    );
  }
}
