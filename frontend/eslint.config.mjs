import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

/**
 * Hand-rolled flat config instead of `eslint-config-next` via FlatCompat: the
 * shareable "next/core-web-vitals" config transitively pulls in a version of
 * eslint-plugin-react whose flat-config export contains circular references
 * that @eslint/eslintrc's legacy JSON-based validator cannot serialize,
 * crashing every lint run. Consuming @next/eslint-plugin-next directly avoids
 * that broken code path entirely.
 */
const eslintConfig = [
  ...tseslint.configs.recommended,
  {
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["jest.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
