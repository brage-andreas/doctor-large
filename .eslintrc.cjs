const { builtinModules } = require("node:module");
const { Linter } = require("eslint");
const eslintConfig = require("./.eslintrc.json");

// Two `.eslintrc` files are being used as there is better intellisense
// in the JSON file, and this is the best of both worlds

/**
 * @type {Linter.Config}
 */
const config = {
	...eslintConfig,
	rules: {
		...eslintConfig.rules,
		"no-restricted-globals": [
			"error",
			...builtinModules.map((moduleName) => ({
				name: moduleName,
				message: `Verbosely import from \`node:${moduleName}\` instead.`
			}))
		]
	}
};

module.exports = config;
