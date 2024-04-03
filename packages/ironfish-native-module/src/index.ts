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
