import * as React from 'react';

import { IronfishNativeModuleViewProps } from './IronfishNativeModule.types';

export default function IronfishNativeModuleView(props: IronfishNativeModuleViewProps) {
  return (
    <div>
      <span>{props.name}</span>
    </div>
  );
}
