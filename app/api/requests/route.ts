import { listRequests } from "@/app/lib/request-log";

export async function GET() {
  return Response.json({ requests: listRequests() });
}
