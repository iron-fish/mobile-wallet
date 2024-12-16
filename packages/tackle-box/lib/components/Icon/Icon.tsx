import ArrowReceive from "./svg/arrow-receive.svg?react";
import ArrowSend from "./svg/arrow-send.svg?react";
import ArrowsBridge from "./svg/arrows-bridge.svg?react";
import ChevronRight from "./svg/chevron-right.svg?react";
import Eye from "./svg/eye.svg?react";
import EyeSlash from "./svg/eye-slash.svg?react";
import Gear from "./svg/gear.svg?react";
import HamburgerMenu from "./svg/hamburger-menu.svg?react";
import FaceId from "./svg/face-id.svg?react";
import NumberPadOrchid from "./svg/number-pad--orchid.svg?react";

const ICONS = {
  "arrow-receive": ArrowReceive,
  "arrow-send": ArrowSend,
  "arrows-bridge": ArrowsBridge,
  "chevron-right": ChevronRight,
  "face-id": FaceId,
  gear: Gear,
  "hamburger-menu": HamburgerMenu,
  "number-pad-orchid": NumberPadOrchid,
  eye: Eye,
  "eye-slash": EyeSlash,
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
} & React.SVGProps<SVGSVGElement>;

export function Icon({ name, ...props }: Props) {
  const IconComponent = ICONS[name];

  return <IconComponent {...props} />;
}
