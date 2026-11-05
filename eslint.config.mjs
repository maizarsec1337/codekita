import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/**", ".pnpm-store/**", "dist/**", "**/*.env", "coverage/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json", "./frontend/tsconfig.json", "./backend/tsconfig.json", "./packages/shared/tsconfig.json"],
        tsconfigRootDir: process.cwd(),
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": ["warn", { checksVoidReturn: false }],
    },
  },
  {
    files: ["**/*.tsx"],
    languageOptions: {
      globals: { ...globals.browser },
    },
  }
);