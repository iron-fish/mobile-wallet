import ArrowReceive from "./svg/arrow-receive.svg?react";
import ArrowSend from "./svg/arrow-send.svg?react";
import ArrowsBridge from "./svg/arrows-bridge.svg?react";

const ICONS = {
  "arrow-receive": ArrowReceive,
  "arrow-send": ArrowSend,
  "arrows-bridge": ArrowsBridge,
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name?: IconName;
} & React.SVGProps<SVGSVGElement>;

export function Icon({ name = "arrow-receive", ...props }: Props) {
  const IconComponent = ICONS[name];

  return <IconComponent {...props} />;
}
