import type { ConciergeServiceResult } from "./types";

export function toConciergeApiResponse<T>(
  result: ConciergeServiceResult<T>,
  notFoundStatus = 404,
): Response {
  if (!result.ok) {
    const status =
      result.error === "unauthorized"
        ? 401
        : result.error === "forbidden"
          ? 403
          : result.error === "not_found"
            ? notFoundStatus
            : result.error === "validation_error"
              ? 400
              : 503;
    return Response.json(result, { status });
  }
  return Response.json(result);
}
