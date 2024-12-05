import { ReactNode } from "react";
import { type Edges, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import Svg, { RadialGradient, Rect, Stop } from "react-native-svg";

type Props = {
  from: string;
  to: string;
  children: ReactNode;
  edges?: Edges;
};

export function SafeAreaGradient({
  from,
  to,
  children,
  edges = ["top"],
}: Props) {
  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.safeArea,
        {
          backgroundColor: to,
        },
      ]}
    >
      <View style={styles.svgContainer}>
        <Svg style={StyleSheet.absoluteFillObject}>
          <RadialGradient
            id="gradient"
            cx="50%"
            cy="50%"
            rx="50%"
            ry="50%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </RadialGradient>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#gradient)" />
        </Svg>
      </View>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  svgContainer: {
    position: "absolute",
    top: 140,
    left: 0,
    width: "100%",
    aspectRatio: 1,
    zIndex: -1,
    flexDirection: "row",
    justifyContent: "center",
  },
});
