import type { NextRequest } from "next/server";
import { recordRequest, REQUEST_BODY_LIMIT } from "@/app/lib/request-log";

async function capture(
  req: NextRequest,
  ctx: RouteContext<"/api/ingest/[[...path]]">,
) {
  const { path } = await ctx.params;
  const rawBody = await req.text();
  const bodySize = rawBody.length;
  const truncated = bodySize > REQUEST_BODY_LIMIT;
  const body = truncated ? rawBody.slice(0, REQUEST_BODY_LIMIT) : rawBody;
  const subPath = path && path.length > 0 ? "/" + path.join("/") : "";

  const entry = recordRequest({
    method: req.method,
    path: "/api/ingest" + subPath,
    query: Object.fromEntries(req.nextUrl.searchParams),
    headers: Object.fromEntries(req.headers),
    body,
    bodyTruncated: truncated,
    bodySize,
  });

  return Response.json({ ok: true, id: entry.id });
}

export const GET = capture;
export const POST = capture;
export const PUT = capture;
export const PATCH = capture;
export const DELETE = capture;

export async function HEAD(
  req: NextRequest,
  ctx: RouteContext<"/api/ingest/[[...path]]">,
) {
  await capture(req, ctx);
  return new Response(null, { status: 200 });
}
