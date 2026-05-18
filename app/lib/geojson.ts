const GEOMETRY_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

function isGeometry(
  v: unknown,
): v is { type: string; coordinates?: unknown; geometries?: unknown } {
  if (!v || typeof v !== "object") return false;
  const t = (v as { type?: unknown }).type;
  if (typeof t !== "string" || !GEOMETRY_TYPES.has(t)) return false;
  if (t === "GeometryCollection") {
    return Array.isArray((v as { geometries?: unknown }).geometries);
  }
  return Array.isArray((v as { coordinates?: unknown }).coordinates);
}

function collectGeometries(node: unknown, out: object[], depth = 0): void {
  if (depth > 50 || node == null) return;
  if (Array.isArray(node)) {
    for (const x of node) collectGeometries(x, out, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  if (isGeometry(node)) {
    out.push(node as object);
    return;
  }
  for (const v of Object.values(node as Record<string, unknown>)) {
    collectGeometries(v, out, depth + 1);
  }
}

export function tryParseGeoJson(body: string): object | null {
  if (!body) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const t = (parsed as { type?: unknown }).type;
  if (t === "Feature" || t === "FeatureCollection") return parsed as object;
  const geoms: object[] = [];
  collectGeometries(parsed, geoms);
  if (geoms.length === 0) return null;
  return {
    type: "FeatureCollection",
    features: geoms.map((g) => ({
      type: "Feature",
      geometry: g,
      properties: {},
    })),
  };
}
