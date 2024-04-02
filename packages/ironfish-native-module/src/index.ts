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

export async function generateKey(): Promise<Key> {
  return await IronfishNativeModule.generateKey();
}

export async function generateKeyFromPrivateKey(
  privateKey: string,
): Promise<Key> {
  return await IronfishNativeModule.generateKeyFromPrivateKey(privateKey);
}
