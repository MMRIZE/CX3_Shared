import { defineConfig } from "eslint/config"
import globals from "globals"
import js from "@eslint/js"

export default defineConfig([
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: { js },
    extends: ["js/recommended"],
    rules: {
      "no-var": "error",
      "prefer-const": "error",
    }
  }
])
