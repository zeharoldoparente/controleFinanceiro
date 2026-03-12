function isHttpsRequest(req) {
   if (req.secure) return true;

   const forwardedProto = String(req.headers["x-forwarded-proto"] || "")
      .split(",")[0]
      .trim()
      .toLowerCase();

   return forwardedProto === "https";
}

function securityHeadersMiddleware(req, res, next) {
   res.setHeader("X-Content-Type-Options", "nosniff");
   res.setHeader("X-Frame-Options", "DENY");
   res.setHeader("Referrer-Policy", "no-referrer");
   res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
   res.setHeader("Cross-Origin-Resource-Policy", "same-site");
   res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
   );

   if (isHttpsRequest(req)) {
      res.setHeader(
         "Strict-Transport-Security",
         "max-age=31536000; includeSubDomains",
      );
   }

   return next();
}

module.exports = securityHeadersMiddleware;
