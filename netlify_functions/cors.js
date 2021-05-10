var axios = require("axios");
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
	var options = {
    url: url.href,
    method: event.httpMethod.toUpperCase(),
    headers: {
    	"Cookie": cookie_string,
    	"User-Agent": useragent
    },
    data: event.body,
    responseType: "text",
    transformResponse: [(data) => { return data; }] // prevent JSON parsing
  };
  var response = await axios(options);
  return {
  	statusCode: 200,
  	body: response.data,
  	headers: {
  	  "content-type": response.headers["content-type"] || "",
  	  "set-cookie": response.headers["set-cookie"] || ""
  	}
  };
};
