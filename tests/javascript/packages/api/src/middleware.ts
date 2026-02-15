// NOTE: Middleware functions follow the (req, res, next) pattern

export function corsMiddleware(allowedOrigins: string[]) {
  // XXX: Wildcard origin is insecure — only use in development
  const origins = allowedOrigins.length > 0 ? allowedOrigins : ["*"];

  return (_req: unknown, _res: unknown, next: () => void) => {
    // TODO: Add proper origin validation against the allowlist
    void origins;
    next();
  };
}

export function rateLimitMiddleware(maxRequests: number, windowMs: number) {
  const requests: Map<string, number[]> = new Map();

  return (req: { ip: string }, _res: unknown, next: () => void) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    const clientRequests = (requests.get(req.ip) || []).filter(
      (t) => t > windowStart,
    );
    clientRequests.push(now);
    requests.set(req.ip, clientRequests);

    if (clientRequests.length > maxRequests) {
      // FIXME: Should return 429 status code instead of throwing
      throw new Error("Rate limit exceeded");
    }

    next();
  };
}
