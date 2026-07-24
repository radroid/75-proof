import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next. Because this REPLACES the
  // preset's defaults, every generated/vendored path we don't author must be
  // listed here explicitly — otherwise ESLint lints it.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The OpenNext → Cloudflare Workers bundle. Minified, generated, and huge:
    // linting it buried ~122 real source errors under ~26,700 noise problems.
    ".open-next/**",
  ]),
]);

export default eslintConfig;
