/* eslint-env node */

/**
 * @type {import('expo/metro-config')}
 */
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

// Modules in our node_modules that are used and require React Native-specific overrides
// (whether because we need them in React Native, or because they're executed when code is required in @ironfish/sdk)
const shims = {
  "@ironfish/rust-nodejs": {
    type: "sourceFile",
    filePath: require.resolve(__dirname + "/shims/ironfish-rust-nodejs.js"),
  },
  "@napi-rs/blake-hash": {
    type: "sourceFile",
    filePath: require.resolve(__dirname + "/shims/blake-hash.js"),
  },
  path: {
    type: "sourceFile",
    filePath: require.resolve(__dirname + "/shims/path.js"),
  },
  worker_threads: {
    type: "sourceFile",
    filePath: require.resolve(__dirname + "/shims/worker_threads.js"),
  },
};

// Modules in our node_modules that are unused and contain Node.js-specific code.
const emptyModules = new Set([
  "levelup",
  "leveldown",
  "node:fs/promises",
  "fs/promises",
  "node-datachannel",
  "sqlite3",
]);

module.exports = (() => {
  const config = getDefaultConfig(projectRoot);
  const { transformer, resolver } = config;

  config.watchFolders = [monorepoRoot];

  config.resolver = {
    ...resolver,
    nodeModulesPaths: [
      path.resolve(projectRoot, "node_modules"),
      path.resolve(monorepoRoot, "node_modules"),
    ],
    resolveRequest: (context, moduleName, platform) => {
      if (shims[moduleName]) {
        return shims[moduleName];
      }

      if (emptyModules.has(moduleName)) {
        return {
          type: "empty",
        };
      }

      // Optionally, chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform);
    },
    // Node.js built-in modules that are unused.
    // These will only be replaced with empty modules if they can't be found in the project's node_modules.
    // If the project includes a module with the same name, it will be used instead.
    // Modules with slashes in the name need to go in emptyModules instead.
    extraNodeModules: {
      ...resolver.extraNodeModules,
      assert: resolver.emptyModulePath,
      child_process: resolver.emptyModulePath,
      crypto: resolver.emptyModulePath,
      events: resolver.emptyModulePath,
      fs: resolver.emptyModulePath,
      http: resolver.emptyModulePath,
      net: resolver.emptyModulePath,
      os: resolver.emptyModulePath,
      stream: resolver.emptyModulePath,
      tls: resolver.emptyModulePath,
      url: resolver.emptyModulePath,
      util: resolver.emptyModulePath,
      worker_threads: resolver.emptyModulePath,
      v8: resolver.emptyModulePath,
    },
  };

  config.transformer = {
    ...transformer,
    unstable_allowRequireContext: true,
  };

  return config;
})();
