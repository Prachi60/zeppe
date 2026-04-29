const DEFAULT_API_PORT = "7000";
const DEFAULT_API_PATH = "/api";

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, "");
}

function ensureApiPath(pathname) {
  if (!pathname || pathname === "/") return DEFAULT_API_PATH;
  return pathname.endsWith("/api") ? pathname : `${pathname.replace(/\/+$/, "")}/api`;
}

function buildLocalApiUrl(hostname) {
  const protocol = window.location.protocol || "http:";
  return `${protocol}//${hostname}:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;
}

function buildSameOriginApiUrl() {
  return `${normalizeOrigin(window.location.origin)}${DEFAULT_API_PATH}`;
}

function parseEnvUrl(rawUrl) {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    return `${normalizeOrigin(parsed.origin)}${ensureApiPath(parsed.pathname)}`;
  } catch {
    return null;
  }
}

function shouldRewriteLocalhost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function resolveApiBaseUrl() {
  const envUrl =
    parseEnvUrl(import.meta.env.VITE_API_URL) ||
    parseEnvUrl(import.meta.env.VITE_API_BASE_URL) ||
    parseEnvUrl(import.meta.env.VITE_BACKEND_URL) ||
    parseEnvUrl(import.meta.env.VITE_RENDER_BACKEND_URL);

  const browserHostname = window.location.hostname;
  const isLocalBrowser = shouldRewriteLocalhost(browserHostname);
  if (!envUrl) {
    if (isLocalBrowser) {
      const fallbackHost = browserHostname || "localhost";
      return buildLocalApiUrl(fallbackHost);
    }
    // Production fallback: same origin (for proxy setups), never localhost:7000.
    return buildSameOriginApiUrl();
  }

  try {
    const parsed = new URL(envUrl);
    const envIsLocal = shouldRewriteLocalhost(parsed.hostname);

    if (envIsLocal && !isLocalBrowser) {
      // Prevent broken production builds where env still points at localhost.
      return buildSameOriginApiUrl();
    }

    if (envIsLocal && isLocalBrowser) {
      parsed.hostname = browserHostname;
    }

    if (!isLocalBrowser && parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    return `${normalizeOrigin(parsed.origin)}${ensureApiPath(parsed.pathname)}`;
  } catch {
    if (isLocalBrowser) {
      const fallbackHost = browserHostname || "localhost";
      return buildLocalApiUrl(fallbackHost);
    }
    return buildSameOriginApiUrl();
  }
}

export function resolveSocketBaseUrl() {
  const explicitSocketUrl = parseEnvUrl(import.meta.env.VITE_SOCKET_URL);
  if (explicitSocketUrl) {
    try {
      const parsed = new URL(explicitSocketUrl);
      const isLocalBrowser = shouldRewriteLocalhost(window.location.hostname);
      const envIsLocal = shouldRewriteLocalhost(parsed.hostname);
      if (!isLocalBrowser && envIsLocal) {
        return normalizeOrigin(window.location.origin);
      }
      if (!isLocalBrowser && parsed.protocol === "http:") {
        parsed.protocol = "https:";
      }
      return normalizeOrigin(parsed.origin);
    } catch {
      return explicitSocketUrl.replace(/\/api$/, "");
    }
  }
  return resolveApiBaseUrl().replace(/\/api$/, "");
}
