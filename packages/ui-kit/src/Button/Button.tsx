import React, { ComponentProps } from "react";
import { View, Text, styled } from "@tamagui/web";

const ButtonFrame = styled(View, {
  name: "Button",
  alignItems: "center",
  flexDirection: "row",
  backgroundColor: "$background",
  height: "$md",
  borderRadius: "$full",
  paddingHorizontal: 32,
  paddingVertical: 14,

  hoverStyle: {
    backgroundColor: "$backgroundHover",
  },
  pressStyle: {
    backgroundColor: "$backgroundPress",
  },
});

export const ButtonText = styled(Text, {
  name: "ButtonText",
  color: "$color",
  fontFamily: "$body",
  fontSize: "$md",
  lineHeight: "$md",
  userSelect: "none",
});

type ButtonProps = ComponentProps<typeof ButtonFrame>;

export const Button = ({ children, ...rest }: ButtonProps) => (
  <ButtonFrame {...rest}>
    <ButtonText>{children}</ButtonText>
  </ButtonFrame>
);
