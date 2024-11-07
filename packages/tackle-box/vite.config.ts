import { defineConfig, PluginOption } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
// import reactStrictBabelPreset from "react-strict-dom/babel-preset";

function getPlatform(mode: string) {
  if (!["web", "native"].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  return {
    isWeb: mode === "web",
    isNative: mode === "native",
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const platform = getPlatform(mode);

  const plugins: PluginOption[] = [react()];

  if (platform.isNative) {
    plugins.push(
      dts({
        tsconfigPath: "./tsconfig.app.json",
        include: ["lib"],
        rollupTypes: true,
      }),
    );
  }

  return {
    plugins,
    build: {
      minify: false,
      emptyOutDir: false,
      lib: {
        name: "@ironfish/tackle-box",
        entry: resolve(__dirname, "lib/index.ts"),
        fileName: platform.isNative ? "main-native" : "main-web",
      },
      rollupOptions: {
        external: ["react", "react-dom", "react-native", /react-native\/.*/],
        output: {
          globals: {
            react: "react",
          },
          generatedCode: {
            symbols: false,
          },
        },
      },
    },
    resolve: {
      conditions: platform.isNative ? ["react-native"] : [],
    },
  };
});
