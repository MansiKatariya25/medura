/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

type LatLng = { lat: number; lng: number };

function decodePolyline(encoded: string): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

async function callOlaRouteOptimizer(apiKey: string, start: LatLng, end: LatLng) {
  const url = `https://api.olamaps.io/routing/v1/routeOptimizer?api_key=${encodeURIComponent(apiKey)}`;
  const baseHeaders = {
    "Content-Type": "application/json",
    "x-request-id": crypto.randomUUID(),
    "x-correlation-id": crypto.randomUUID(),
  } as const;

  const payloadAttempts = [
    { locations: [start, end], travel_mode: "driving" },
    { waypoints: [start, end], travel_mode: "driving" },
    { origin: start, destination: end, travel_mode: "driving" },
  ];

  let lastError: unknown = null;
  for (const payload of payloadAttempts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        lastError = { status: res.status, data };
        continue;
      }
      if (data?.status === "OK" && Array.isArray(data.routes) && data.routes[0]) {
        return data;
      }
      lastError = data;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    typeof lastError === "string" ? lastError : "Ola routing request failed"
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { start?: LatLng; end?: LatLng }
      | null;
    const start = body?.start;
    const end = body?.end;

    if (!start || !end) {
      return NextResponse.json({ error: "Missing start/end" }, { status: 400 });
    }
    if (
      typeof start.lat !== "number" ||
      typeof start.lng !== "number" ||
      typeof end.lat !== "number" ||
      typeof end.lng !== "number"
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const apiKey =
      process.env.OLA_MAPS_API_KEY || process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OLA_MAPS_API_KEY missing" }, { status: 500 });
    }

    const data = await callOlaRouteOptimizer(apiKey, start, end);
    const route = data.routes?.[0];
    const overview = route?.overview_polyline;

    let coordinates: [number, number][] = [];
    if (typeof overview === "string" && overview.length > 0) {
      coordinates = decodePolyline(overview);
    } else if (Array.isArray(route?.legs)) {
      coordinates = route.legs
        .map((leg: any) => {
          const startLoc = leg?.start_location;
          const endLoc = leg?.end_location;
          const points: [number, number][] = [];
          if (
            typeof startLoc?.lng === "number" &&
            typeof startLoc?.lat === "number"
          ) {
            points.push([startLoc.lng, startLoc.lat]);
          }
          if (
            typeof endLoc?.lng === "number" &&
            typeof endLoc?.lat === "number"
          ) {
            points.push([endLoc.lng, endLoc.lat]);
          }
          return points;
        })
        .flat();
    }

    const legs = Array.isArray(route?.legs) ? route.legs : [];
    const distanceMeters = legs.reduce(
      (sum: number, leg: any) => sum + (Number(leg?.distance) || 0),
      0
    );
    const durationSeconds = legs.reduce(
      (sum: number, leg: any) => sum + (Number(leg?.duration) || 0),
      0
    );

    return NextResponse.json({
      status: data.status || "OK",
      source_from: data.source_from || "Ola Maps",
      coordinates,
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch route" },
      { status: 500 }
    );
  }
}
