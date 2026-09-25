// ESLint 9 reads only this flat format; the old .eslintrc.json was ignored,
// which is why `npm run lint` failed. Same three rules as before.
export default [
  { ignores: ["node_modules/", "client/", "data/"] },
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
      "prefer-const": "error",
    },
  },
];
