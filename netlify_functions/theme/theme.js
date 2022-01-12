const {promises: fs} = require("fs");
const path = require("path");

async function read_file(theme_name) {
	try {
		let theme_file = "./theme/themes/" + theme_name;
		let theme_filepath = (process.env.LAMBDA_TASK_ROOT)? path.resolve(process.env.LAMBDA_TASK_ROOT, theme_file):path.resolve(__dirname, theme_file)
		return {
			text: await fs.readFile(theme_filepath, "utf8"),
			error: false
		}
	}
	catch {
		return {
			error: true
		}
	}
}

exports.handler = async (event, context) => {
	let default_theme = "default.css"
	let theme_name = event.headers.cookie.match(/(?<=theme=)[^;]+/g) || defdefault_theme;
	
	let theme = await read_file(theme_name);
	if (theme.error) {
		theme = await read_file(default_theme);
	}
	return {
		statusCode: 200,
		headers: {
			"Content-Type": "text/css"
		},
		body: theme.text
	};
};
