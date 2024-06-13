// Import the native module. On web, it will be resolved to IronfishNativeModule.web.ts
// and on native platforms to IronfishNativeModule.ts
import IronfishNativeModule from "./IronfishNativeModule";

export interface Key {
  spendingKey: string;
  viewKey: string;
  incomingViewKey: string;
  outgoingViewKey: string;
  publicAddress: string;
  proofAuthorizingKey: string;
}

export function generateKey(): Key {
  return IronfishNativeModule.generateKey();
}

export function spendingKeyToWords(
  privateKey: string,
  languageCode: number,
): string {
  return IronfishNativeModule.spendingKeyToWords(privateKey, languageCode);
}

export function wordsToSpendingKey(
  words: string,
  languageCode: number,
): string {
  return IronfishNativeModule.wordsToSpendingKey(words, languageCode);
}

export function generateKeyFromPrivateKey(privateKey: string): Key {
  return IronfishNativeModule.generateKeyFromPrivateKey(privateKey);
}

export function isValidPublicAddress(hexAddress: string): boolean {
  return IronfishNativeModule.isValidPublicAddress(hexAddress);
}

export function unpackGzip(
  gzipPath: string,
  outputPath: string,
): Promise<boolean> {
  return IronfishNativeModule.unpackGzip(gzipPath, outputPath);
}

export function readPartialFile(
  path: string,
  offset: number,
  length: number,
): Promise<Uint8Array> {
  return IronfishNativeModule.readPartialFile(path, offset, length);
}
