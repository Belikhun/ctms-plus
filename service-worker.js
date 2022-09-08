

// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
const PRECACHE = "precache";
const RUNTIME = "runtime";

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
	"index.html",
	"./",
	"metadata.json"
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", event => {
	event.waitUntil(
		caches.open(PRECACHE)
			.then(cache => cache.addAll(PRECACHE_URLS))
			.then(self.skipWaiting())
	);
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
	const currentCaches = [PRECACHE, RUNTIME];
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
		}).then(cachesToDelete => {
			return Promise.all(cachesToDelete.map(cacheToDelete => {
				return caches.delete(cacheToDelete);
			}));
		}).then(() => self.clients.claim())
	);
});

self.addEventListener("fetch",

	/**
	 * @param {FetchEvent} event 
	 */
	(event) => {
		// Skip cross-origin requests, like those for Google Analytics.
		if (event.request.url.startsWith(self.location.origin) && !event.request.url.includes("ping.html")) {
			event.respondWith(
				fetch(event.request).then(async response => {
					let cache = await caches.open(RUNTIME);
					cache.put(event.request, response.clone());
					return response;
				}).catch(() => {
					return caches.match(event.request);
				})
			);
		}
	}
);