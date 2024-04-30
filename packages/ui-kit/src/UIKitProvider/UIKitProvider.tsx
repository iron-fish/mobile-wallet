import React, { ReactNode } from "react";
import { TamaguiProvider, Theme } from "tamagui";
import { ToastProvider } from "@tamagui/toast";
import { config } from "../theme/config";

type Props = {
  children: ReactNode;
  colorScheme: "light" | "dark";
};

export function UIKitProvider({ children, colorScheme }: Props) {
  return (
    <TamaguiProvider
      disableInjectCSS
      config={config}
      defaultTheme={colorScheme}
    >
      <Theme name={colorScheme}>
        <ToastProvider
          swipeDirection="horizontal"
          duration={6000}
          native={
            [
              /* uncomment the next line to do native toasts on mobile. NOTE: it'll require you making a dev build and won't work with Expo Go */
              // 'mobile'
            ]
          }
        >
          {children}
        </ToastProvider>
      </Theme>
    </TamaguiProvider>
  );
}
