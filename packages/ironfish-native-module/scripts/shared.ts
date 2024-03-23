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

  return {
    monorepoRootDir,
    nativeModuleProjectDir,
    toMonorepoRootDir: () => {
      process.chdir(monorepoRootDir);
    },
  };
}
