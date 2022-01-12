const fetch = require("node-fetch");

exports.handler = async (event, context) => {
	console.log(event.path)
	let theme_name = "default.css"
	let theme_text = await fetch("themes/" + theme_name).then(a => a.text());
	// let theme_text = "test"
	return {
		statusCode: 200,
		headers: {
			"Content-Type": "text/css"
		},
		body: theme_text
	};
};
