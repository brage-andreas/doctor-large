const { builtinModules } = require("node:module");

module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true
	},

	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
		project: "tsconfig.json",
		sourceType: "module"
	},

	plugins: ["@typescript-eslint"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier"
	],

	rules: {
		"@typescript-eslint/array-type": ["error", { default: "generic" }],
		"@typescript-eslint/await-thenable": "error",
		"@typescript-eslint/consistent-type-definitions": "error",
		"@typescript-eslint/consistent-type-imports": [
			"error",
			{
				fixStyle: "inline-type-imports"
			}
		],
		"@typescript-eslint/explicit-member-accessibility": "error",
		"@typescript-eslint/member-ordering": "error",
		"@typescript-eslint/method-signature-style": ["error", "method"],
		"@typescript-eslint/no-implicit-any-catch": "error",
		"@typescript-eslint/no-inferrable-types": "error",
		"@typescript-eslint/no-meaningless-void-operator": "error",
		"@typescript-eslint/no-misused-promises": "error",
		"@typescript-eslint/no-non-null-asserted-nullish-coalescing": "error",
		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/no-unnecessary-condition": "error",
		"@typescript-eslint/no-unnecessary-type-arguments": "error",
		"@typescript-eslint/no-unnecessary-type-assertion": "error",
		"@typescript-eslint/prefer-optional-chain": "error",
		"@typescript-eslint/promise-function-async": "error",
		"@typescript-eslint/prefer-readonly": "error",
		"@typescript-eslint/require-await": "error",
		"@typescript-eslint/sort-type-union-intersection-members": "error",
		"@typescript-eslint/switch-exhaustiveness-check": "error",
		"arrow-body-style": ["error", "as-needed"],
		"consistent-return": "error",
		"curly": "error",
		"eqeqeq": ["error", "smart"],
		"no-constant-binary-expression": "error",
		"no-constructor-return": "error",
		"no-duplicate-imports": "error",
		"no-else-return": "error",
		"no-extra-boolean-cast": "error",
		"no-implicit-coercion": "error",
		"no-invalid-regexp": "error",
		"no-lonely-if": "error",
		"no-multi-assign": "error",
		"no-new-native-nonconstructor": "error",
		"no-param-reassign": "error",
		"no-restricted-globals": [
			"error",
			...builtinModules.map((moduleName) => ({
				name: moduleName,
				message: `Import from \`node:${moduleName}\` instead.`
			}))
		],
		"no-self-compare": "error",
		"no-unneeded-ternary": "error",
		"no-unused-private-class-members": "error",
		"no-useless-concat": "error",
		"no-useless-escape": "error",
		"no-useless-rename": "error",
		"no-useless-return": "error",
		"no-var": "error",
		"object-curly-newline": [
			"error",
			{
				ExportDeclaration: {
					consistent: true,
					minProperties: 4,
					multiline: true
				},
				ObjectExpression: {
					consistent: true,
					minProperties: 4,
					multiline: true
				}
			}
		],
		"object-shorthand": "error",
		"padding-line-between-statements": [
			"error",
			{
				blankLine: "always",
				next: ["return", "if", "for", "while", "switch", "throw"],
				prev: "*"
			},
			{
				blankLine: "always",
				next: "*",
				prev: [
					"multiline-block-like",
					"multiline-const",
					"multiline-expression",
					"multiline-let"
				]
			}
		],
		"prefer-arrow-callback": "error",
		"prefer-const": "error",
		"prefer-template": "error",
		"quotes": ["error", "double", { avoidEscape: true }],
		"yoda": ["error", "never"]
	}
};
