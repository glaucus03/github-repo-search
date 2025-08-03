import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // App Router特有のルール
      "@next/next/no-duplicate-head": "off", // App Routerでは不要

      // 型安全性の強化
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // App Router Conventionsに準拠
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    files: ["**/__tests__/**/*", "**/*.{test,spec}.*"],
    languageOptions: {
      globals: {
        jest: true,
        expect: true,
        test: true,
        describe: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
      },
    },
  },
  {
    files: ["e2e/**/*"],
    languageOptions: {
      globals: {
        browser: true,
      },
    },
  },
];

export default eslintConfig;
