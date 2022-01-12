exports.handler = async (event, context) => {
	let default_theme = "default.css"
	let theme_name = event.headers.cookie.match(/(?<=theme=)[^;]+/g) || default_theme;
	
	return {
		statusCode: 301,
		headers: {
			"location": event.path.replace("theme.css", "themes/" + theme_name)
		},
	};
};
