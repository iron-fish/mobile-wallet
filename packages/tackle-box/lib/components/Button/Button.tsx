import { html, css } from "react-strict-dom";
import { ComponentProps } from "react";

const styles = css.create({
  base: {
    backgroundColor: {
      default: "#000",
      ":hover": "#ff0000",
      ":focus": "#00ff00",
      ":active": "#0000ff",
    },
    color: "white",
    textAlign: "center",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 20,
    borderRadius: 9999,
  },
});

type ButtonProps = ComponentProps<typeof html.button>;

type Props = {
  title: string;
} & Omit<ButtonProps, "children">;

export function Button({ title, ...rest }: Props) {
  return (
    <html.button style={styles.base} {...rest}>
      {title}
    </html.button>
  );
}
