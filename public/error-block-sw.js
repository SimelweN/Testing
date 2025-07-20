// Minimal Service Worker - Only blocks actual problematic network requests
const BLOCKED_DOMAINS = [
  // Block known problematic third-party domains that cause fetch errors
  "edge.fullstory.com",
  "fullstory.com",
];

const BLOCKED_PATHS = ["fs.js"];

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Check if this is a blocked domain or path
  const shouldBlock =
    BLOCKED_DOMAINS.some((domain) => url.includes(domain)) ||
    BLOCKED_PATHS.some((path) => url.includes(path));

  if (shouldBlock) {
    // Return a successful empty response instead of letting the request fail
    event.respondWith(
      new Response("{}", {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  // Let all other requests proceed normally
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
