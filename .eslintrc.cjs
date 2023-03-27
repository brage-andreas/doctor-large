const { builtinModules } = require("node:module");
const { Linter } = require("eslint");
const eslintConfig = require("./.eslintrc.json");

// Two `.eslintrc` files are being used since there is better intellisense in the JSON file.

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
