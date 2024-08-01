/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-check

// import eslint from "@eslint/js";
// import tseslint from "typescript-eslint";
// import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
// import globals from "globals";
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const globals = require("globals");

// import globals from "globals";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
// import js from "@eslint/js";
// import { FlatCompat } from "@eslint/eslintrc";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const compat = new FlatCompat({
//   baseDirectory: __dirname,
//   recommendedConfig: js.configs.recommended,
//   allConfig: js.configs.all,
// });

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.webextensions,
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: true,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      "@typescript-eslint/restrict-plus-operands": [
        "error",
        {
          allowNumberAndString: true,
        },
      ],

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
        },
      ],

      "@typescript-eslint/no-non-null-assertion": ["off"],
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },
  {
    files: ["**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  eslintPluginPrettierRecommended,
);

// const old =  [
//   ...compat.extends("eslint:recommended"),
//   {
//     languageOptions: {
//       globals: {
//         ...globals.webextensions,
//         ...globals.browser,
//         ...globals.node,
//       },
//     },
//   },
//   ...compat
//     .extends(
//       "plugin:@typescript-eslint/strict-type-checked",
//       "plugin:@typescript-eslint/stylistic-type-checked",
//     )
//     .map((config) => ({
//       ...config,
//       files: ["**/*.ts", "**/*.tsx"],
//     })),
//   {
//     files: ["**/*.ts", "**/*.tsx"],
//       languageOptions: {
//       parserOptions: {
//         project: true,
//         tsconfigRootDir: import.meta.dirname,
//       },
//     },

//   },
//   {
//     files: ['**/*.js'],
//     ...tseslint.configs.disableTypeChecked,
//   }
// ];
