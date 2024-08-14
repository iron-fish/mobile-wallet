// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    // This rule fails if @ironfish/ui hasn't been built yet, so we can disable it
    // specifically for that package.
    "import/no-unresolved": ["error", { ignore: ["^@ironfish/ui"] }],
    "prettier/prettier": "error",
  },
};
