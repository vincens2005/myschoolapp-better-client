var fetch = require("node-fetch");
exports.handler = async (event, context) => {
	var url = event.path;

	url = url.split(".netlify/functions/cors/")[1];
	url = decodeURIComponent(url);
	url = new URL(url);
	for (var i in event.queryStringParameters) {
		url.searchParams.append(i, event.queryStringParameters[i]);
	}
	console.log(url.href);
	var cookie_string = event.headers.cookie || "";
	var useragent = event.headers["user-agent"] || "";
	var RVC = event.headers.requestverificationtoken || "";
	console.log(RVC)
	var headers_to_send = {
		"Cookie": cookie_string,
		"User-Agent": useragent,
		"RequestVerificationToken": RVC,
		"content-type": "application/json",
		"accept": "*/*",
		"host": url.host
	};
	var options = {
		method: event.httpMethod.toUpperCase(),
		headers: headers_to_send,
		body: event.body
	};
	var response = await fetch(url, options);
	var response_text = await response.text();
	var headers = response.headers.raw();
	console.log(headers);
	return {
		statusCode: 200,
		body: response_text,
		headers: {
			"content-type": headers["content-type"] || "",
			"set-cookie": headers["set-cookie"] || "no-new-cooks=yes;",
			"X-gimme-da-cooks": headers["set-cookie"] || "no-new-cooks=yes;", // looks like we're gonna have to use this lol
			"access-control-expose-headers": "set-cookie"
		}
	};
};

