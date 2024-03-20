import { NativeModulesProxy, EventEmitter, Subscription } from 'expo-modules-core';

// Import the native module. On web, it will be resolved to IronfishNativeModule.web.ts
// and on native platforms to IronfishNativeModule.ts
import IronfishNativeModule from './IronfishNativeModule';
import IronfishNativeModuleView from './IronfishNativeModuleView';
import { ChangeEventPayload, IronfishNativeModuleViewProps } from './IronfishNativeModule.types';

// Get the native constant value.
export const PI = IronfishNativeModule.PI;

export function hello(): string {
  return IronfishNativeModule.hello();
}

export async function setValueAsync(value: string) {
  return await IronfishNativeModule.setValueAsync(value);
}

const emitter = new EventEmitter(IronfishNativeModule ?? NativeModulesProxy.IronfishNativeModule);

export function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription {
  return emitter.addListener<ChangeEventPayload>('onChange', listener);
}

export { IronfishNativeModuleView, IronfishNativeModuleViewProps, ChangeEventPayload };
