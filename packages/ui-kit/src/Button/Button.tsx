import React, { ComponentProps } from "react";
import { css, html } from "react-strict-dom";

const styles = css.create({
  root: {
    backgroundColor: "black",
    borderRadius: "1000px",
    color: "white",
    fontSize: "16px",
    fontWeight: 600,
    paddingBottom: 14,
    paddingLeft: 32,
    paddingRight: 32,
    paddingTop: 14,
  },
});

type Props = ComponentProps<typeof html.button>;

export function Button({ children, style, ...rest }: Props) {
  return (
    <html.button style={[styles.root, style ? style : false]} {...rest}>
      {children}
    </html.button>
  );
}
