import { createFont } from "@tamagui/core";

export const fonts = {
  body: createFont({
    family: `Inter`,
    size: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      "2xl": 40,
      "3xl": 44,
      "4xl": 70,
    },
    letterSpacing: {},
    weight: {
      4: "400",
    },
    lineHeight: {
      xs: 19,
      sm: 21,
      md: 27,
      lg: 26,
      xl: 36,
      "2xl": 54,
      "3xl": 50,
      "4xl": 62,
    },
  }),

  heading: createFont({
    family: `Inter`,
    size: {
      xs: 12,
      sm: 16,
      md: 20,
      lg: 24,
      xl: 32,
      "2xl": 40,
      "3xl": 44,
      "4xl": 70,
    },
    letterSpacing: {},
    lineHeight: {
      xs: 19,
      sm: 21,
      md: 27,
      lg: 26,
      xl: 36,
      "2xl": 54,
      "3xl": 50,
      "4xl": 62,
    },
    transform: {
      5: "uppercase",
      6: "none",
    },
    weight: {
      4: "400",
      5: "700",
    },
  }),
};

export const FONT_VARIANTS = {
  xs: {
    fontFamily: "Favorit",
    fontSize: 12,
    lineHeight: "19px",
  },
  sm: {
    fontFamily: "Favorit",
    fontSize: 16,
    lineHeight: "21px",
  },
  md: {
    fontFamily: "Favorit",
    fontSize: 20,
    lineHeight: "27px",
  },
  lg: {
    fontFamily: "Favorit",
    fontSize: 24,
    lineHeight: "26px",
  },
  xl: {
    fontFamily: "Favorit",
    fontSize: 32,
    lineHeight: "36px",
  },
  "2xl": {
    fontFamily: "Favorit",
    fontSize: 40,
    lineHeight: "54px",
  },
  "3xl": {
    fontFamily: "FavoritExtended",
    fontSize: 44,
    lineHeight: "50px",
  },
  "4xl": {
    fontFamily: "FavoritExtended",
    fontSize: 70,
    lineHeight: "62px",
  },
};
