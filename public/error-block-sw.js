// Service Worker for Network-Level Error Blocking
const BLOCKED_DOMAINS = [
  "edge.fullstory.com",
  "fullstory.com",
  "213f0d6feb0c4f74bf8db7ef237f0dbe-315d37effbbd45138374f8eea.fly.dev",
];

const BLOCKED_PATHS = ["fs.js", "@vite/client"];

self.addEventListener("install", () => {
  console.debug("🛡️ Error blocking service worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.debug("🛡️ Error blocking service worker activated");
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Block problematic domains and paths
  const shouldBlock =
    BLOCKED_DOMAINS.some((domain) => url.includes(domain)) ||
    BLOCKED_PATHS.some((path) => url.includes(path));

  if (shouldBlock) {
    console.debug("🚫 Blocked network request:", url);
    event.respondWith(
      new Response("{}", {
        status: 200,
        statusText: "OK",
        headers: { "Content-Type": "application/json" },
      }),
    );
    return;
  }

  // Let other requests proceed normally
  event.respondWith(fetch(event.request));
});
