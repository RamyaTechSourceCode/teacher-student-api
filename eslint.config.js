import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "coverage", "node_modules"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // All files run in Node.js
  {
    languageOptions: {
      globals: globals.node,
    },
  },

  // CommonJS config files (e.g. jest.config.cjs)
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
  },

  // Allow intentionally unused parameters/variables prefixed with "_"
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  prettier
);