const minify = require('@node-minify/core');
const csso = require('@node-minify/csso');
module.exports = {

	onPostBuild: async ({
		inputs,
		constants,
		utils
	}) => {
		if (!inputs.contexts.includes(process.env.CONTEXT)) {
			console.log('Not minifiying CSS in the context:', process.env.CONTEXT);
			return;
		}
		try {
			await minify({
        compressor: csso,
        input: constants.PUBLISH_DIR + '/**/*.css',
        output: '$1.css',
        replaceInPlace: true,
        options: {
          ...inputs.minifierOptions
        }
      });
		}
		catch (error) {
			utils.build.failPlugin('The Minify CSS plugin failed.', { error })
		}
	}
};
