import React from "react";
import type { Preview } from "@storybook/react";
import { ColorScheme } from "../src/components/ColorScheme/ColorScheme";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, { context }) => {
      const isDarkMode = context.globals?.backgrounds?.value === "#333333";
      return (
        <ColorScheme value={isDarkMode ? "_dark" : "_light"}>
          <Story />
        </ColorScheme>
      );
    },
  ],
};

export default preview;
