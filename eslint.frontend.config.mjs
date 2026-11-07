import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

// Frontend-only lint: typechecking is handled separately by typecheck:frontend.
export default tseslint.config(
  { ignores: ["**/node_modules/**", "**/dist/**", "src/server/**", "src/common/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
);