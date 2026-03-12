const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX = 120;

function normalizeKey(value) {
   return String(value || "anonymous").trim().toLowerCase();
}

function createRateLimiter(options = {}) {
   const windowMs =
      Number.isFinite(options.windowMs) && options.windowMs > 0
         ? options.windowMs
         : DEFAULT_WINDOW_MS;
   const max =
      Number.isFinite(options.max) && options.max > 0
         ? options.max
         : DEFAULT_MAX;
   const statusCode =
      Number.isInteger(options.statusCode) && options.statusCode >= 400
         ? options.statusCode
         : 429;
   const message =
      options.message ||
      "Muitas requisicoes em pouco tempo. Tente novamente em instantes.";
   const keyGenerator =
      typeof options.keyGenerator === "function"
         ? options.keyGenerator
         : (req) => `${req.userId || req.ip}:${req.baseUrl || ""}:${req.path}`;

   const buckets = new Map();

   function cleanup(now) {
      for (const [key, timestamps] of buckets.entries()) {
         const fresh = timestamps.filter((ts) => now - ts < windowMs);
         if (fresh.length === 0) {
            buckets.delete(key);
            continue;
         }
         buckets.set(key, fresh);
      }
   }

   return function rateLimitMiddleware(req, res, next) {
      const now = Date.now();
      cleanup(now);

      const rawKey = keyGenerator(req);
      const key = normalizeKey(rawKey);
      const timestamps = buckets.get(key) || [];
      const fresh = timestamps.filter((ts) => now - ts < windowMs);

      if (fresh.length >= max) {
         const retryAfterSec = Math.max(
            1,
            Math.ceil((windowMs - (now - fresh[0])) / 1000),
         );
         res.set("Retry-After", String(retryAfterSec));
         return res.status(statusCode).json({ error: message });
      }

      fresh.push(now);
      buckets.set(key, fresh);
      return next();
   };
}

module.exports = { createRateLimiter };
