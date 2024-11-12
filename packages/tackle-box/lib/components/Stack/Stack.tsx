import { ReactElement } from "react";
import { html } from "react-strict-dom";

type Props = {
  children?: ReactElement;
  direction: "horizontal" | "vertical";
};

export function Stack({ children }: Props) {
  return <html.div>{children}</html.div>;
}
