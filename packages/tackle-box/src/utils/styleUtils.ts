import { ImageStyle, TextStyle, ViewStyle } from "react-native";

type Style = ViewStyle | TextStyle | ImageStyle;

type DefineStylesObj = {
  [key: string]: Style | DefineStylesObj;
};

export function createStyles<TObj extends DefineStylesObj>(obj: TObj) {
  return obj;
}
