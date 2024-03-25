import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';

import { IronfishNativeModuleViewProps } from './IronfishNativeModule.types';

const NativeView: React.ComponentType<IronfishNativeModuleViewProps> =
  requireNativeViewManager('IronfishNativeModule');

export default function IronfishNativeModuleView(props: IronfishNativeModuleViewProps) {
  return <NativeView {...props} />;
}
