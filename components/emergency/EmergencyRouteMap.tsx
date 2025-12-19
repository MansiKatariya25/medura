"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OlaMaps } from "olamaps-web-sdk";
import { MapPin, Menu, Navigation } from "lucide-react";

type LatLng = { lat: number; lng: number };

const envStyle = process.env.NEXT_PUBLIC_OLA_MAPS_STYLE_URL || "";
const DEFAULT_STYLE_URL =
  envStyle && !envStyle.includes("/styles/v1/")
    ? envStyle
    : "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json";

const FALLBACK_CENTER = { lat: 28.6927, lng: 76.9355 };

const buildMarker = (color: string) => {
  const el = document.createElement("div");
  el.className =
    "h-4 w-4 rounded-full border-2 border-white shadow-[0_6px_16px_rgba(0,0,0,0.3)]";
  el.style.background = color;
  return el;
};

export default function EmergencyRouteMap({
  stage,
}: {
  stage: "searching" | "dispatch" | "video";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const olaRef = useRef<OlaMaps | null>(null);
  const markerRef = useRef<{ user?: any; ambulance?: any }>({});

  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [ambulancePos, setAmbulancePos] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [locationLabel, setLocationLabel] = useState("Locating...");
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY;

  const withOlaApiKey = useCallback((url: string, key?: string) => {
    if (!key) return url;
    try {
      const parsed = new URL(url);
      if (parsed.hostname !== "api.olamaps.io") return url;
      if (parsed.searchParams.has("api_key")) return url;
      parsed.searchParams.set("api_key", key);
      return parsed.toString();
    } catch {
      return url;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!navigator.geolocation) {
      setUserPos(FALLBACK_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted) return;
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPos(coords);
      },
      () => {
        if (!mounted) return;
        setUserPos(FALLBACK_CENTER);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!userPos) return;
    const offset = 0.015;
    const dest: LatLng = {
      lat: userPos.lat + offset * 0.6,
      lng: userPos.lng + offset,
    };
    setAmbulancePos(dest);
  }, [userPos]);

  useEffect(() => {
    if (!userPos) return;
    const params = new URLSearchParams({
      lat: String(userPos.lat),
      lng: String(userPos.lng),
    });
    fetch(`/api/location/reverse?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.label) {
          setLocationLabel(data.label);
        }
      })
      .catch(() => null);
  }, [userPos]);

  useEffect(() => {
    if (!userPos || !ambulancePos) return;
    let mounted = true;
    fetch("/api/ola/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: userPos, end: ambulancePos }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data?.coordinates) && data.coordinates.length > 1) {
          setRouteCoords(data.coordinates);
        } else {
          setRouteCoords([
            [userPos.lng, userPos.lat],
            [ambulancePos.lng, ambulancePos.lat],
          ]);
        }
        if (typeof data?.durationSeconds === "number") {
          setEtaMinutes(Math.max(1, Math.round(data.durationSeconds / 60)));
        }
      })
      .catch(() => {
        if (!mounted) return;
        setRouteCoords([
          [userPos.lng, userPos.lat],
          [ambulancePos.lng, ambulancePos.lat],
        ]);
      });
    return () => {
      mounted = false;
    };
  }, [ambulancePos, userPos]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !apiKey) return;
    let mounted = true;

    const init = async () => {
      try {
        const olaModule = await import("olamaps-web-sdk");
        if (!mounted) return;
        const { OlaMaps } = olaModule;
        const ola = new OlaMaps({ apiKey });
        olaRef.current = ola;

        // Fetch style JSON so we can sanitize any layers that reference unavailable vector source layers
        let styleParam: any = withOlaApiKey(DEFAULT_STYLE_URL, apiKey);
        try {
          const resp = await fetch(withOlaApiKey(DEFAULT_STYLE_URL, apiKey));
          if (resp.ok) {
            const styleJson = await resp.json();
            const originalLength = (styleJson.layers || []).length;
            styleJson.layers = (styleJson.layers || []).filter((ly: any) => {
              const sourceLayer = ly["source-layer"] ?? ly.sourceLayer ?? "";
              // remove any layer that explicitly targets the 3d_model source-layer or known problematic id
              if (sourceLayer === "3d_model" || ly.id === "3d_model_data") return false;
              return true;
            });
            if (styleJson.layers.length !== originalLength) {
              console.warn("Sanitized map style: removed layers referencing missing 3d_model source-layer");
            }
            styleParam = styleJson;
          }
        } catch {
          // ignore fetch errors and fall back to using the style URL string
        }

        const map = ola.init({
          style: styleParam,
          container: containerRef.current as HTMLElement,
          center: [FALLBACK_CENTER.lng, FALLBACK_CENTER.lat],
          zoom: 12,
          pitch: 0,
          bearing: 0,
        });

        mapRef.current = map;
        map.dragRotate?.disable?.();
        map.touchZoomRotate?.disableRotation?.();

        // Ignore specific vector-source layer errors that can happen when a style references a source-layer not available in the tileset
        map.on?.("error", (err: any) => {
          try {
            const msg = err?.error?.message ?? err?.message ?? String(err);
            if (typeof msg === "string" && msg.includes("3d_model")) {
              // swallow this known non-fatal error
              console.warn("Map error ignored:", msg);
              return;
            }
          } catch {
            // noop
          }
          // Re-throw or log other errors so they are visible during development
          console.error(err);
        });

        map.on?.("load", () => {
          if (!mounted) return;
          map.resize?.();
        });
      } catch {
        // map init errors are handled by fallback UI
      }
    };

    init();

    return () => {
      mounted = false;
      mapRef.current?.remove?.();
      mapRef.current = null;
      olaRef.current = null;
    };
  }, [apiKey, withOlaApiKey]);

  const geojson = useMemo(
    () => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: routeCoords,
      },
    }),
    [routeCoords]
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || routeCoords.length < 2) return;

    const updateRoute = () => {
      const source = map.getSource?.("route-line");
      if (source?.setData) {
        source.setData(geojson);
        return;
      }
      map.addSource?.("route-line", {
        type: "geojson",
        data: geojson,
      });
      map.addLayer?.({
        id: "route-glow",
        type: "line",
        source: "route-line",
        paint: {
          "line-color": "#3B82F6",
          "line-width": 10,
          "line-opacity": 0.25,
        },
      });
      map.addLayer?.({
        id: "route-main",
        type: "line",
        source: "route-line",
        paint: {
          "line-color": "#1D4ED8",
          "line-width": 4,
        },
      });
    };

    if (map.isStyleLoaded?.()) {
      updateRoute();
    } else {
      map.on?.("load", updateRoute);
    }
  }, [geojson, routeCoords.length]);

  useEffect(() => {
    const map = mapRef.current;
    const ola = olaRef.current;
    if (!map || !ola || !userPos || !ambulancePos) return;

    if (!markerRef.current.user) {
      markerRef.current.user = ola
        .addMarker({ element: buildMarker("#2563EB") })
        .setLngLat([userPos.lng, userPos.lat])
        .addTo(map);
    } else {
      markerRef.current.user.setLngLat([userPos.lng, userPos.lat]);
    }

    if (!markerRef.current.ambulance) {
      markerRef.current.ambulance = ola
        .addMarker({ element: buildMarker("#F43F5E") })
        .setLngLat([ambulancePos.lng, ambulancePos.lat])
        .addTo(map);
    } else {
      markerRef.current.ambulance.setLngLat([
        ambulancePos.lng,
        ambulancePos.lat,
      ]);
    }

    if (map.fitBounds && routeCoords.length >= 2) {
      const lngs = routeCoords.map((coord) => coord[0]);
      const lats = routeCoords.map((coord) => coord[1]);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 800,
      });
    }
  }, [ambulancePos, routeCoords, userPos]);

  return (
    <div className="relative h-[300px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1020] shadow-[0_25px_60px_rgba(0,0,0,0.45)] sm:h-[340px]">
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1630]/80 via-transparent to-[#0b0f1d]/70" />

      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur">
          <MapPin className="h-4 w-4 text-white" />
          <span className="line-clamp-1 max-w-[200px]">{locationLabel}</span>
        </div>
        <button className="rounded-full border border-white/20 bg-white/10 p-2">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-2 rounded-b-[28px] bg-[#2e74da]/95 px-4 py-3 text-white shadow-[0_-10px_25px_rgba(0,0,0,0.2)]">
        <div className="text-sm font-semibold">
          {stage === "searching"
            ? "Searching for nearest AMBULANCE"
            : `${etaMinutes ?? 3} mins away `}
          {stage !== "searching" && (
            <span className="text-xs font-medium text-white/70">
              (Estimated arrival)
            </span>
          )}
        </div>
        {stage !== "searching" && (
          <div className="flex items-center justify-between text-xs text-white/85">
            <div className="space-y-1">
              <div className="font-semibold">Rakesh Mukherjee</div>
              <div className="text-white/70">Plate: ABC 123 Y 12</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-white/30 bg-white/10 p-2">
                <Navigation className="h-4 w-4" />
              </div>
              <div className="rounded-full border border-white/30 bg-white/10 p-2">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
