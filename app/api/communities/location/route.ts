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
      return NextResponse.json({ suggestions: [] });
    }

    const url = `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
      q
    )}&api_key=${apiKey}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      return NextResponse.json({ suggestions: [] });
    }
    const data = (await res.json()) as any;
    const suggestions =
      data?.predictions?.map((item: any) => ({
        id: item.place_id || item.reference || item.description,
        description: item.description,
        latitude: item.geometry?.location?.lat ?? null,
        longitude: item.geometry?.location?.lng ?? null,
      })) || [];

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
