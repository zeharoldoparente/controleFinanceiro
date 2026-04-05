const TOKEN_KEY = "token";
const USER_KEY = "user";

function isBrowser() {
   return typeof window !== "undefined";
}

function decodeBase64Url(value: string) {
   const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
   const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

   return window.atob(padded);
}

function decodeTokenPayload(token: string): { exp?: number } | null {
   try {
      const [, payload] = token.split(".");
      if (!payload) return null;

      return JSON.parse(decodeBase64Url(payload));
   } catch {
      return null;
   }
}

export function clearAuthSession() {
   if (!isBrowser()) return;

   localStorage.removeItem(TOKEN_KEY);
   localStorage.removeItem(USER_KEY);
}

export function getStoredToken() {
   if (!isBrowser()) return null;

   return localStorage.getItem(TOKEN_KEY);
}

export function getValidToken() {
   const token = getStoredToken();
   if (!token) return null;

   const payload = decodeTokenPayload(token);
   const expiresAt = typeof payload?.exp === "number" ? payload.exp * 1000 : 0;

   if (!expiresAt || Date.now() >= expiresAt) {
      clearAuthSession();
      return null;
   }

   return token;
}

export function redirectToLoginWithSessionExpired() {
   if (!isBrowser()) return;

   clearAuthSession();

   const next =
      window.location.pathname === "/login"
         ? ""
         : `${window.location.pathname}${window.location.search}`;
   const params = new URLSearchParams({ session_expired: "1" });

   if (next) params.set("next", next);

   const target = `/login?${params.toString()}`;
   if (window.location.pathname === "/login") {
      window.location.replace(target);
      return;
   }

   window.location.href = target;
}
