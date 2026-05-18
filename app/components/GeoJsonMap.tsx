"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = { data: object };

export default function GeoJsonMap({ data }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    let bounds: L.LatLngBounds | null = null;
    try {
      const layer = L.geoJSON(data as GeoJSON.GeoJsonObject, {
        pointToLayer: (_f, latlng) =>
          L.circleMarker(latlng, {
            radius: 6,
            weight: 2,
            color: "#0ea5e9",
            fillColor: "#0ea5e9",
            fillOpacity: 0.6,
          }),
        style: {
          color: "#0ea5e9",
          weight: 2,
          fillColor: "#0ea5e9",
          fillOpacity: 0.2,
        },
      }).addTo(map);
      const b = layer.getBounds();
      if (b.isValid()) bounds = b;
    } catch {
      // bad geometry — fall through to default view
    }

    if (bounds && bounds.isValid()) {
      if (bounds.getSouthWest().equals(bounds.getNorthEast())) {
        map.setView(bounds.getCenter(), 13);
      } else {
        map.fitBounds(bounds, { padding: [16, 16], maxZoom: 16 });
      }
    } else {
      map.setView([0, 0], 1);
    }

    return () => {
      map.remove();
    };
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="h-60 w-full rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden"
    />
  );
}
