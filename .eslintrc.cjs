/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ["dist", "node_modules", "vendor", "coverage"],
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
  overrides: [
    {
      files: ["**/*.tsx"],
      plugins: ["react"],
      extends: [
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
      ],
      settings: {
        react: {
          version: "detect",
        },
      },
      rules: {
        "react/prop-types": "off",
      },
    },
  ],
};
