module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      ...(process.env.EAS_BUILD_PLATFORM === "android"
        ? []
        : [
            [
              "@tamagui/babel-plugin",
              {
                components: ["@ironfish/ui", "tamagui"],
                config: "../../packages/ui-kit/src/theme/config.ts",
              },
            ],
          ]),
    ],
  };
};
