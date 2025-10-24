import next from "eslint-config-next";

export default [
  ...next(),
  {
    ignores: [
      "node_modules",
      ".next",
      "dist",
      "build",
      "coverage",
      "infrastructure/stripe-eventbridge/cdk.out"
    ]
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];
