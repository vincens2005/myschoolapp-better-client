/*
	we need a separate download proxy because of the way netlify handles things.
	basically, netlify only supports plaintext transfer,
	so if you try to transfer something that is not plaintext, it errors out.
	a workaround to this is to encode the file into base64 and send it.
	that is why this function exists: it transfers files as base64
	however, base64 increases filesize, so we should only use it when neccesary.
	that is why this is separate from cors.js
	also, cors.js has some extra code to handle auth and stuff
	this is a very basic endpoint that only downloads files.
	DO NOT USE THIS TO DOWNLOAD ANY PLAINTEXT
	doing that would slow down load speed and load speed is a high priority
*/

var fetch = require("node-fetch");
exports.handler = async (event, context) => {
	var url = event.path;

	url = url.split(".netlify/functions/download/")[1];
	url = decodeURIComponent(url);
	url = new URL(url);
	for (var i in event.queryStringParameters) {
		url.searchParams.append(i, event.queryStringParameters[i]);
	}
	console.log(url.href); // our final URL
	
	var cookie_string = event.headers.cookie || "";
	var useragent = event.headers["user-agent"] || "";
	
	var headers_to_send = {
		"Cookie": cookie_string,
		"User-Agent": useragent,
		"content-type": "application/json",
		"accept": "*/*",
		"host": url.host
	};
	
	var options = {
		method: event.httpMethod.toUpperCase(),
		headers: headers_to_send,
		body: event.body
	};
	
	// delete body if it's not a POST request
	if (event.httpMethod.toUpperCase() == "GET" || event.httpMethod.toUpperCase() == "HEAD") {
		delete options.body;
	}
	var response = await fetch(url, options);
	
	var headers = response.headers.raw();
	var content_type =  String(headers["content-type"]) || "text/plain";
	
	// convert file to base64
	var response_buffer = await response.buffer();
	var base64_encoded = response_buffer.toString("base64");
	
	return {
		statusCode: 200,
		isBase64Encoded: true,
		body: base64_encoded,
		headers: {
			"content-type": content_type
		}
	};
};
