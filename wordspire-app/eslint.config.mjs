import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  { ignores: [".next/**", ".work/**", "node_modules/**", "public/**"] },
  {
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,mjs}", "tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-constant-condition": "warn",
      "no-console": "warn",
    },
  },
  { files: ["scripts/**/*.{ts,mjs}"], rules: { "no-console": "off" } },
];
