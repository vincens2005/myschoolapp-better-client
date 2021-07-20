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
