import { COLORS, RADII } from "../../theme/tokens";
import { createStyles } from "../../utils/styleUtils";

export const buttonStyles = createStyles({
  base: {
    alignItems: "center",
    borderRadius: RADII.full,
    flexDirection: "row",
    justifyContent: "center",
  },
  variant: {
    solid: {
      _light: {
        backgroundColor: COLORS.black,
      },
      _dark: {
        backgroundColor: COLORS.white,
      },
      active: {
        _light: {
          backgroundColor: COLORS.gray_7,
        },
        _dark: {
          backgroundColor: COLORS.gray_1,
        },
      },
    },
    outline: {
      _light: {
        backgroundColor: COLORS.white,
        borderColor: "#000",
      },
      _dark: {
        backgroundColor: COLORS.gray_8,
        borderColor: COLORS.white,
      },
      active: {
        _light: {
          backgroundColor: COLORS.gray_1,
        },
        _dark: {
          backgroundColor: COLORS.gray_7,
        },
      },
      size: {
        md: {
          borderWidth: 2,
        },
        sm: {
          borderWidth: 1,
        },
      },
    },
  },
  disabled: {
    _light: {
      backgroundColor: COLORS.gray_3,
    },
    _dark: {
      backgroundColor: COLORS.gray_6,
    },
  },
  size: {
    md: {
      gap: 8,
      height: 55,
      paddingVertical: 14,
      paddingHorizontal: 32,
    },
    sm: {
      gap: 6,
      height: 45,
      paddingVertical: 10,
      paddingHorizontal: 24,
    },
  },
  width: {
    full: {
      width: "100%",
    },
    auto: {
      width: "auto",
    },
  },
} as const);

export const textStyles = createStyles({
  variant: {
    solid: {
      _light: {
        color: COLORS.white,
      },
      _dark: {
        color: COLORS.black,
      },
    },
    outline: {
      _light: {
        color: COLORS.black,
      },
      _dark: {
        color: COLORS.white,
      },
    },
  },
  size: {
    md: {
      fontSize: 20,
    },
    sm: {
      fontSize: 16,
    },
  },
  disabled: {
    color: COLORS.gray_5,
  },
});

export const iconStyles = createStyles({
  view: {
    width: 16,
    alignItems: "center",
  },
  variant: {
    solid: {
      _light: {
        color: COLORS.white,
      },
      _dark: {
        color: COLORS.black,
      },
    },
    outline: {
      _light: {
        color: COLORS.black,
      },
      _dark: {
        color: COLORS.white,
      },
    },
  },
  disabled: {
    _light: {
      color: COLORS.gray_5,
    },
    _dark: {
      color: COLORS.gray_5,
    },
  },
});
