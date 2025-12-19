import { NextResponse } from "next/server";

function buildRequestId() {
  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function pickLabel(address: Record<string, unknown>) {
  const city =
    (address.city as string | undefined) ||
    (address.locality as string | undefined) ||
    (address.town as string | undefined) ||
    (address.village as string | undefined) ||
    (address.suburb as string | undefined);
  const region =
    (address.state as string | undefined) ||
    (address.region as string | undefined) ||
    (address.principalSubdivision as string | undefined);
  const country =
    (address.country as string | undefined) ||
    (address.countryCode as string | undefined) ||
    (address.country_code as string | undefined);

  const parts = [city, region, country].filter(Boolean) as string[];
  const deduped = parts.filter((part, idx) => parts.indexOf(part) === idx);
  return deduped.join(", ");
}

async function fetchFallback(lat: number, lng: number) {
  const providers = [
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
  ];

  for (const url of providers) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "medura-location/1.0",
        },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        address?: Record<string, unknown>;
      };
      const address =
        (data.address as Record<string, unknown> | undefined) || data;
      const label = pickLabel(address);
      if (label) return label;
    } catch {
      // try next
    }
  }

  return "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Missing or invalid coordinates." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OLA_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OLA_MAPS_API_KEY." },
      { status: 500 },
    );
  }

  const url = `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${apiKey}`;
  const res = await fetch(url, {
    headers: {
      "X-Request-Id": buildRequestId(),
      "X-Correlation-Id": buildRequestId(),
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const fallbackLabel = await fetchFallback(lat, lng);
    if (fallbackLabel) {
      return NextResponse.json({ label: fallbackLabel });
    }
    return NextResponse.json(
      { error: "Reverse geocode failed." },
      { status: res.status },
    );
  }

  const data = (await res.json()) as {
    results?: Array<Record<string, unknown>>;
    geocodingResults?: Array<Record<string, unknown>>;
    data?: Array<Record<string, unknown>>;
    addresses?: Array<Record<string, unknown>>;
    place?: Record<string, unknown>;
  };

  const first =
    data?.results?.[0] ||
    data?.geocodingResults?.[0] ||
    data?.data?.[0] ||
    data?.addresses?.[0] ||
    data?.place;

  if (!first) {
    const fallbackLabel = await fetchFallback(lat, lng);
    return NextResponse.json({ label: fallbackLabel });
  }

  const address =
    (first.address as Record<string, unknown> | undefined) || first;
  const label = pickLabel(address);

  const fallback =
    (first.formatted_address as string | undefined) ||
    (first.formattedAddress as string | undefined) ||
    (first.display_name as string | undefined) ||
    (first.address as string | undefined) ||
    (first.name as string | undefined) ||
    "";

  if (!label && !fallback) {
    const fallbackLabel = await fetchFallback(lat, lng);
    return NextResponse.json({ label: fallbackLabel });
  }

  return NextResponse.json({ label: label || fallback });
}
