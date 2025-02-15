import { SvgXml } from "react-native-svg";

const svgContent = `<svg width="238" height="238" viewBox="0 0 238 238" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="119" cy="119" rx="119" ry="119" transform="rotate(90 119 119)" fill="#D657D9" fill-opacity="0.1"/>
<ellipse cx="119" cy="119" rx="103" ry="103" transform="rotate(90 119 119)" fill="#D657D9" fill-opacity="0.1"/>
<circle cx="119" cy="119" r="87" transform="rotate(90 119 119)" fill="#D657D9" fill-opacity="0.1"/>
<circle cx="119" cy="119" r="71" transform="rotate(90 119 119)" fill="#D657D9" fill-opacity="0.1"/>
    <path
      d="M108.779 144L85 120.773L90.9448 114.967L108.779 132.387L147.055 95L153 100.807L108.779 144Z"
      fill="#D657D9"
    />
  </svg>`;

export default function SendConfirmed() {
  return <SvgXml xml={svgContent} />;
}
