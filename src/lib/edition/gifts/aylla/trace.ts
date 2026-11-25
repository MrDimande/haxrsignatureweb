import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export interface AyllaTraceContext {
  readonly requestId: string;
  readonly route: string;
  readonly startedAt: number;
}

const ayllaTraceStorage = new AsyncLocalStorage<AyllaTraceContext>();

export function getActiveAyllaTrace(): AyllaTraceContext | undefined {
  return ayllaTraceStorage.getStore();
}

export function runWithAyllaTrace<T>(
  requestId: string,
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  return ayllaTraceStorage.run(
    { requestId, route, startedAt: Date.now() },
    fn
  );
}

/**
 * Emits sanitized correlation logs for active Core HTTP gift requests.
 * Never logs secrets, tokens, passwords, OTPs, contacts, or connection strings.
 */
export function logAyllaTrace(
  stage: string,
  meta: Record<string, string | number | boolean | undefined> = {}
): void {
  const ctx = ayllaTraceStorage.getStore();
  if (!ctx) return;

  const cleanMeta: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) {
      cleanMeta[key] = value;
    }
  }

  console.info(
    JSON.stringify({
      scope: "core/aylla/trace",
      at: new Date().toISOString(),
      requestId: ctx.requestId,
      route: ctx.route,
      elapsedMs: Date.now() - ctx.startedAt,
      stage,
      ...cleanMeta,
    })
  );
}

export async function withCoreAyllaRouteTrace<T extends Response>(
  request: Request,
  routeName: string,
  handler: (requestId: string) => Promise<T>
): Promise<Response> {
  const requestId = request.headers.get("x-request-id")?.trim() || randomUUID();
  const startedAt = Date.now();

  return runWithAyllaTrace(requestId, routeName, async () => {
    logAyllaTrace("core_route_enter", { method: request.method });
    try {
      const response = await handler(requestId);
      logAyllaTrace("core_route_exit", {
        status: response.status,
        durationMs: Date.now() - startedAt,
      });
      try {
        response.headers.set("x-request-id", requestId);
      } catch {
        // Fallback if a test returned an immutable Response
        const clone = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        clone.headers.set("x-request-id", requestId);
        return clone;
      }
      return response;
    } catch (err) {
      logAyllaTrace("core_route_error", {
        durationMs: Date.now() - startedAt,
        errorName: err instanceof Error ? err.name : "UnknownError",
      });
      throw err;
    }
  });
}
