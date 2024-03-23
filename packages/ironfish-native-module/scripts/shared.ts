import path from "path";

export const CONSTANTS = {
  rustLibName: "rust_lib",
} as const;

export function getDirUtils() {
  const nativeModuleProjectDir = process.cwd();

  if (!nativeModuleProjectDir.endsWith("ironfish-native-module")) {
    throw new Error(
      'Invalid current directory. Expected "ironfish-native-module" but got ' +
        nativeModuleProjectDir,
    );
  }

  const monorepoRootDir = path.join(nativeModuleProjectDir, "..", "..");
  const rustLibDir = path.join(nativeModuleProjectDir, "rust_lib");

  return {
    monorepoRootDir,
    toMonorepoRootDir: () => {
      process.chdir(monorepoRootDir);
    },
    nativeModuleProjectDir,
    toNativeModuleProjectDir: () => {
      process.chdir(nativeModuleProjectDir);
    },
    rustLibDir,
    toRustLibDir: () => {
      process.chdir(rustLibDir);
    },
  };
}
