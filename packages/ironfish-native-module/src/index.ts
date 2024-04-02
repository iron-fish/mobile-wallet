// Import the native module. On web, it will be resolved to IronfishNativeModule.web.ts
// and on native platforms to IronfishNativeModule.ts
import IronfishNativeModule from "./IronfishNativeModule";

export async function rustAdd(a: number, b: number): Promise<number> {
  return await IronfishNativeModule.rustAdd(a, b);
}
