import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js"],

    extends: [js.configs.recommended],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },

    rules: {
      "no-unused-vars": "warn",
      "eqeqeq": "error",
      "prefer-const": "warn",
      "no-var": "error",
      "no-console": "off",
    },
  },
]);