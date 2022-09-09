export default async (request, context) => {
	let url = request.url.split("/proxy/");
	url.shift(); // remove first element
	url = url.join(""); // combine other ones. now we've removes the first instance of /proxy/
	url = decodeURIComponent(url);

	if (!url) return new Response("error: no url provided");

	console.log(url)
	url = new URL(url);

	let req = await replicate_request(request, url, {
			host: url.host,
			referer: url.origin + "/app/student"
		});

	let response = await fetch(req);


	return response;
};

// mostly stolen from https://stackoverflow.com/a/48713509/15317442
async function replicate_request(request, url, headers) {
	let new_headers = new Headers(request.headers);

	for (let i in headers) {
		new_headers.set(i, headers[i]);
	}

	return new Request(url, {
		headers: new_headers,
		method: request.method,
		body: request.body
	});
}
