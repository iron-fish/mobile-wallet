import ArrowReceive from "./svg/arrow-receive.svg?react";
import ArrowSend from "./svg/arrow-send.svg?react";
import ArrowsBridge from "./svg/arrows-bridge.svg?react";
import Gear from "./svg/gear.svg?react";
import HamburgerMenu from "./svg/hamburger-menu.svg?react";

const ICONS = {
  "arrow-receive": ArrowReceive,
  "arrow-send": ArrowSend,
  "arrows-bridge": ArrowsBridge,
  gear: Gear,
  "hamburger-menu": HamburgerMenu,
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
} & React.SVGProps<SVGSVGElement>;

export function Icon({ name, ...props }: Props) {
  const IconComponent = ICONS[name];

  return <IconComponent {...props} />;
}
