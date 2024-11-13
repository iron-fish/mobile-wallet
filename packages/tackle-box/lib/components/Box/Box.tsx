import { ReactElement } from "react";
import { html } from "react-strict-dom";

type Props = {
  children?: ReactElement;
};

export function Box({ children }: Props) {
  return (
    <html.div>
      <html.span>{children}</html.span>
    </html.div>
  );
}
