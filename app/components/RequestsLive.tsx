"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LoggedRequest } from "@/app/lib/request-log";
import { tryParseGeoJson } from "@/app/lib/geojson";

const GeoJsonMap = dynamic(() => import("./GeoJsonMap"), {
  ssr: false,
  loading: () => (
    <div className="h-60 w-full rounded bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
  ),
});

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  POST: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  PUT: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300",
  PATCH: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  HEAD: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  OPTIONS: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 1000) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleString();
}

function formatBody(body: string, contentType: string | undefined): string {
  if (!body) return "";
  if (contentType?.toLowerCase().includes("application/json")) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
}

export default function RequestsLive() {
  const [requests, setRequests] = useState<LoggedRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch("/api/requests", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { requests: LoggedRequest[] };
        if (!cancelled) {
          setRequests(data.requests);
          setError(null);
          setLoaded(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }

    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!loaded && !error) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-sm text-zinc-600 dark:text-zinc-400">
        <p className="mb-2 font-medium text-zinc-800 dark:text-zinc-200">
          No requests yet.
        </p>
        <p className="mb-3">
          Send any HTTP method to{" "}
          <code className="font-mono">/api/ingest/&lt;anything&gt;</code>. The
          log lives in memory and resets when the server restarts.
        </p>
        <pre className="overflow-x-auto rounded bg-zinc-100 dark:bg-zinc-900 p-3 text-xs">
{`curl -X POST http://localhost:3000/api/ingest/stripe/webhook \\
  -H 'content-type: application/json' \\
  -d '{"event":"charge.succeeded","amount":4200}'`}
        </pre>
        {error && (
          <p className="mt-3 text-rose-600 dark:text-rose-400">
            Polling error: {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-rose-600 dark:text-rose-400">
          Polling error: {error}
        </p>
      )}
      {requests.map((r) => {
        const contentType = r.headers["content-type"];
        const body = formatBody(r.body, contentType);
        const methodClass =
          METHOD_COLORS[r.method] ?? METHOD_COLORS.OPTIONS;
        const queryEntries = Object.entries(r.query);
        const geo = tryParseGeoJson(r.body);
        return (
          <article
            key={r.id}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 text-sm"
          >
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`inline-block rounded px-2 py-0.5 font-mono text-xs font-semibold ${methodClass}`}
              >
                {r.method}
              </span>
              <code className="font-mono text-zinc-900 dark:text-zinc-100 break-all">
                {r.path}
              </code>
              <span
                className="ml-auto text-xs text-zinc-500 dark:text-zinc-400"
                title={r.receivedAt}
              >
                {relativeTime(r.receivedAt)}
              </span>
            </header>

            {queryEntries.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">query: </span>
                <code className="font-mono">
                  {queryEntries
                    .map(([k, v]) => `${k}=${v}`)
                    .join("&")}
                </code>
              </div>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                Headers ({Object.keys(r.headers).length})
              </summary>
              <dl className="mt-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 font-mono text-xs">
                {Object.entries(r.headers).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-zinc-500 dark:text-zinc-400">{k}</dt>
                    <dd className="text-zinc-800 dark:text-zinc-200 break-all">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>

            {(body || r.bodySize > 0) && (
              <details open className="mt-3">
                <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                  Body ({r.bodySize} bytes
                  {r.bodyTruncated ? ", truncated" : ""})
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 dark:bg-zinc-900 p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                  {body || "(empty)"}
                </pre>
              </details>
            )}

            {geo && (
              <details open className="mt-3">
                <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                  Map preview
                </summary>
                <div className="mt-2">
                  <GeoJsonMap data={geo} />
                </div>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}
