import { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { html } from "react-strict-dom";

/**
 * Union of possible react-strict-dom elements. E.g. html.div, html.p would equal "div" | "p"
 */
export type RSDElementTypes = keyof typeof html;

/**
 * Gets the React.ElementType for a given react-strict-dom element.
 */
type RSDElement<T extends RSDElementTypes> = (typeof html)[T];

/**
 * Gets the props for a given react-strict-dom element.
 */
type RSDElementProps<T extends RSDElementTypes> = ComponentPropsWithoutRef<
  RSDElement<T>
>;

/**
 * Props for the `as` prop that can be used to change the returned element type.
 */
type AsProp<TAsProp extends RSDElementTypes> = {
  as?: TAsProp;
};

/**
 * Utility to create props for polymorphic components.
 */
export type PolymorphicComponentProps<
  TAsProp extends RSDElementTypes,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  TProps extends Record<string, unknown> = {},
> = PropsWithChildren<
  AsProp<TAsProp> & TProps & Omit<RSDElementProps<TAsProp>, keyof TProps>
>;

export function Polymorphic<TAsProp extends RSDElementTypes = "div">({
  as,
  children,
  ...rest
}: PolymorphicComponentProps<TAsProp>) {
  const elementType: RSDElementTypes = as ?? "div";
  const Component = html[elementType];

  return <Component {...rest}>{children}</Component>;
}
