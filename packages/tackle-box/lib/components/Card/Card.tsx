import { PropsWithChildren } from "react";
import { css } from "react-strict-dom";
import { Box } from "@/components/Box/Box";
import { MarginPadding } from "@/utils/useMarginPaddingValues";

const style = css.create({
  shadowWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    zIndex: 1,
  },
});

type CardProps = PropsWithChildren<
  MarginPadding & {
    active?: boolean;
  }
>;

export function Card({
  children,
  active,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  p = 4,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
}: CardProps) {
  return (
    <Box m={m} mx={mx} my={my} mt={mt} mr={mr} mb={mb} ml={ml} pr={1} pb={1}>
      <Box
        borderRadius={4}
        borderWidth={1}
        borderColor="border"
        p={p}
        px={px}
        py={py}
        pt={pt}
        pr={pr}
        pb={pb}
        pl={pl}
        style={style.content}
        bg="background"
      >
        {children}
      </Box>
      <Box style={style.shadowWrapper} pl={1} pt={1}>
        <Box
          borderRadius={4}
          borderWidth={1}
          borderColor="border"
          flexGrow={1}
          bg={active ? "backgroundInverse" : "background"}
        />
      </Box>
    </Box>
  );
}
