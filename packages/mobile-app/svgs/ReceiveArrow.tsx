import { SvgXml } from "react-native-svg";

const svgContent = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.03032 0.684132L0.969408 6.74505M0.969408 6.74505L0.969408 1.89631M0.969408 6.74505L5.81814 6.74505" stroke="#111111"/>
</svg>
`;

export function ReceiveArrow() {
  return <SvgXml xml={svgContent} width="8" height="8" />;
}
