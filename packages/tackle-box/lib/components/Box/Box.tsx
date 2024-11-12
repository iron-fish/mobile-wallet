import { ReactElement } from "react";
import { html, css } from "react-strict-dom";

const styles = css.create({
  base: {
    display: "flex",
    flexDirection: "column",
  },
});

type Props = {
  children?: ReactElement;
};

export function Box({ children }: Props) {
  return <html.div style={[styles.base]}>{children}</html.div>;
}
