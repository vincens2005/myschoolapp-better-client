export default (request, context) => {
	let default_theme = "default.css"
	let theme_name = context.cookies.get("theme") ?? default_theme;

	return context.rewrite(request.url.replace("theme.css", "themes/" + theme_name));
};
