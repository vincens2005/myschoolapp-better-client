const minify = require('@node-minify/core');
const terser = require('@node-minify/terser');
module.exports = {

	onPostBuild: async ({
		inputs,
		constants,
		utils
	}) => {
		if (!inputs.contexts.includes(process.env.CONTEXT)) {
			console.log('Not minifiying JS in the context:', process.env.CONTEXT);
			return;
		}
		try {
			console.log("minifiying JavaScript...");

			await minify({
				compressor: terser,
				input: constants.PUBLISH_DIR + '/**/*.js',
				output: '$1.js',
				replaceInPlace: true,
				options: {
					...inputs.minifierOptions
				}
			});

			console.log("the deed is done.");
		}
		catch (error) {
			console.log("js minify error")
			utils.build.failPlugin('The Minify JS plugin failed.', {error})
		}
	}
};
