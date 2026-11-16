type LogContext = Record<string, string | number | boolean | null>;

export function logServerError(event: string, error: unknown, context: LogContext = {}) {
  const requestId = crypto.randomUUID();
  const detail = error instanceof Error
    ? { name: error.name, message: error.message.slice(0, 500) }
    : { name: "UnknownError", message: String(error).slice(0, 500) };

  console.error("[SPACEXPLORE_OPERATIONAL_ERROR]", {
    event,
    requestId,
    timestamp: new Date().toISOString(),
    ...context,
    error: detail,
  });

  return requestId;
}
