self.importScripts("https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js");

let urls_to_cache = ["style.css", "offline.html", "favicon.ico", "theme.css"];

let cache = localforage.createInstance({
	name: "v2-cache"
});

function cache_response(request, response) {
	cache.setItem(request.url, {
		cached: Date.now()
	});
	caches.open("v2").then(c => {
		c.put(request, response);
	});
	console.log("cached " + request.url)
}

function dontcache(url) {
	url = new URL(url);
	if (url.pathname.startsWith("/proxy/")) return true;
	return false;
}

async function handle_caching(request) {
	if (dontcache(request.url)) return await fetch(request);
	let cached = await cache.getItem(request.url);
	if (!cached && !request.url.endsWith(".css")) {
		if (navigator.onLine) return fetch(request);
		return new Response("");
	}
	if (!navigator.onLine) return caches.match(request);
	let response = await fetch(request);
	cache_response(request, response.clone());
	return response;
}

self.addEventListener("install", e => {
	console.log("installed!")
	for (let url of urls_to_cache) {
		cache.setItem(url, {
			cached: Date.now()
		});
	}

	caches.open("v2").then(c => c.addAll(urls_to_cache));
});

self.addEventListener("fetch", async e => {
	let url = e.request.url;
	if (!navigator.onLine) {

		if (url.endsWith(".js")) return e.respondWith(new Response(""));
		if (url.endsWith(".css") || url.endsWith(".ico")) return e.respondWith(handle_caching(e.request));

		console.log("sending offline.html")

		return e.respondWith(caches.match("offline.html"));
	}

	e.respondWith(handle_caching(e.request));
});
