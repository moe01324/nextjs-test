import RequestsLive from "@/app/components/RequestsLive";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Incoming requests
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            External data providers can send any HTTP method to{" "}
            <code className="font-mono text-zinc-900 dark:text-zinc-200">
              /api/ingest/&lt;anything&gt;
            </code>
            . Calls show up here within ~2s. The log keeps the most recent 200
            requests in memory and resets on server restart.
          </p>
        </header>

        <RequestsLive />
      </main>
    </div>
  );
}
