// src/utils/url.js
export function toAbsoluteMediaUrl(pathOrUrl) {
  if (!pathOrUrl) return null;

  // already absolute?
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // ensure leading slash
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;

  // use configured media base, or fall back to api base origin
  const mediaBase =
    import.meta.env.VITE_MEDIA_BASE_URL ||
    // fallback: derive origin from API base (e.g., http://host:port from http://host:port/api/)
    (() => {
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      try {
        const u = new URL(apiBase, window.location.origin);
        // keep only origin (protocol+host+port)
        return u.origin;
      } catch {
        return window.location.origin;
      }
    })();

  // avoid double slashes
  return `${mediaBase.replace(/\/+$/, "")}${path}`;
}
