import { SvgXml } from "react-native-svg";

const svgContent = `<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.969432 6.74458L7.03035 0.683664M7.03035 0.683664L7.03035 5.5324M7.03035 0.683664L2.18161 0.683664" stroke="#111111"/>
</svg>
`;

export function SendArrow() {
  return <SvgXml xml={svgContent} width="8" height="8" />;
}
