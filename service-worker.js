self.addEventListener("activate", event => {
	event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});