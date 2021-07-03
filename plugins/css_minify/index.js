const minify = require('@node-minify/core');
const sqwish = require('@node-minify/sqwish')
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
			console.log("minifiying css...");
			
			await minify({
        compressor: sqwish,
        input: constants.PUBLISH_DIR + '/**/*.css',
        output: '$1.css',
        replaceInPlace: true,
        options: {
          ...inputs.minifierOptions
        }
      });
      
      console.log("the deed is done.");
		}
		catch (error) {
			console.log("css minify error")
			utils.build.failPlugin('The Minify CSS plugin failed.', { error })
		}
	}
};
