export type LoggedRequest = {
  id: string;
  receivedAt: string;
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: string;
  bodyTruncated: boolean;
  bodySize: number;
};

const MAX_ENTRIES = 200;
export const REQUEST_BODY_LIMIT = 10_000;

type Store = { entries: LoggedRequest[] };
const g = globalThis as unknown as { __requestLog?: Store };
g.__requestLog ??= { entries: [] };

export function recordRequest(
  entry: Omit<LoggedRequest, "id" | "receivedAt">,
): LoggedRequest {
  const full: LoggedRequest = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ...entry,
  };
  const store = g.__requestLog!;
  store.entries.unshift(full);
  if (store.entries.length > MAX_ENTRIES) {
    store.entries.length = MAX_ENTRIES;
  }
  return full;
}

export function listRequests(): LoggedRequest[] {
  return g.__requestLog!.entries;
}
