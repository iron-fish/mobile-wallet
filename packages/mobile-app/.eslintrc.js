// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier", "plugin:import/typescript"],
  rules: {
    "prettier/prettier": "error",
  },
  settings: {
    "import/resolver": {
      typescript: {},
    },
  },
};
