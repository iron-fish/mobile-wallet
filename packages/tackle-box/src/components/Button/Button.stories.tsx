import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    label: { control: "text" },
    variant: { options: ["outline", "solid"] },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onPress: fn() },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {
  args: {
    label: "Click me",
  },
};

export const SolidWithIcon: Story = {
  args: {
    iconLeft: "arrow-left-bottom",
    label: "Click me",
  },
};

export const SolidSmall: Story = {
  args: {
    label: "Click me",
    size: "sm",
  },
};

export const SolidDisabled: Story = {
  args: {
    iconLeft: "arrow-left-bottom",
    label: "Click me",
    disabled: true,
  },
};

export const Outline: Story = {
  args: {
    label: "Click me",
    variant: "outline",
  },
};

export const OutlineWithIcon: Story = {
  args: {
    iconLeft: "arrow-left-bottom",
    label: "Click me",
    variant: "outline",
  },
};

export const OutlineSmall: Story = {
  args: {
    label: "Click me",
    size: "sm",
    variant: "outline",
  },
};
