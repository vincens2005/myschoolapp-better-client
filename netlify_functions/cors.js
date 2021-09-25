var fetch = require("node-fetch");
exports.handler = async (event, context) => {
	var url = event.path;

	url = url.split(".netlify/functions/cors/")[1];
	url = decodeURIComponent(url);
	
	// why does this happen????
	if (url.match(/index.html?\s*\n*$/)) url = url.replace(/index.html?\s*\n*$/, "");
	
	url = new URL(url);
	for (var i in event.queryStringParameters) {
		url.searchParams.append(i, event.queryStringParameters[i]);
	}
	console.log(url.href); // our final URL
	var cookie_string = event.headers.cookie || "";
	var useragent = event.headers["user-agent"] || "";
	var RVT = event.headers.requestverificationtoken || ""; // this token is yoinked from the login page
	
	//console.log(RVT)
	
	var headers_to_send = {
		"Cookie": cookie_string,
		"User-Agent": useragent,
		"RequestVerificationToken": RVT,
		"content-type": "application/json",
		"accept": "*/*",
		"host": url.host,
		"referer": url.origin + "/app/student"
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
	var response_text = await response.text();
	var headers = response.headers.raw(); // as Object rather than Headers
	//console.log(headers);
	var cook_header = null;
	if (headers["set-cookie"] != null && headers["set-cookie"] != undefined) {
		//console.log(headers["set-cookie"]);
		cook_header = headers["set-cookie"];
	}
	return {
		statusCode: response.status,
		body: response_text,
		headers: {
			"content-type": String(headers["content-type"]) || "text/plain",
		},
		multiValueHeaders: {
			"set-cookie": cook_header || []
		}
	};
};
