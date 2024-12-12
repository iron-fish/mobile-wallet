import {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { html, css } from "react-strict-dom";
import { Box } from "../Box/Box";
import { Text } from "../Text/Text";
import { HStack } from "../Stack/Stack";

const TRANSITION_DURATION = 150;

const styles = css.create({
  inset: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },
  bottomSheetContainer: {
    zIndex: 999,
  },
  shade: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    transitionProperty: "opacity",
    transitionDuration: `${TRANSITION_DURATION}ms`,
    opacity: 1,
  },
  shadeLoading: {
    opacity: 0,
  },
  spacer: {
    flexGrow: 1,
  },
  bottomSheet: {
    position: "relative",
    zIndex: 1,
  },
  bottomSheetLoading: {
    opacity: 0,
  },
  bottomSheetReady: {
    transitionProperty: "transform",
    transitionTimingFunction: "ease-in-out",
    transitionDuration: `${TRANSITION_DURATION}ms`,
  },
  bottomSheetTranslateY: (distance: number) => ({
    transform: `translateY(${distance}px)`,
  }),
  bottomSheetBody: {
    // minHeight: 200,
  },
});

type BottomSheetValue = {
  show: (args: { title?: string; body: ReactNode }) => void;
  hide: () => void;
};

// eslint-disable-next-line react-refresh/only-export-components
export const BottomSheetContext = createContext<BottomSheetValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useBottomSheet() {
  const context = useContext(BottomSheetContext);

  if (!context) {
    throw new Error("useBottomSheet must be used within a BottomSheetProvider");
  }

  return context;
}

export function BottomSheetProvider({ children }: PropsWithChildren) {
  const [bottomSheetElement, setBottomSheetElement] =
    useState<ReactNode | null>(null);

  const show = useCallback((args: { title?: string; body: ReactNode }) => {
    setBottomSheetElement(
      <BottomSheet title={args.title}>{args.body}</BottomSheet>,
    );
  }, []);

  const hide = useCallback(() => {
    setBottomSheetElement(null);
  }, []);

  const value = useMemo(
    () => ({
      show,
      hide,
    }),
    [show, hide],
  );

  return (
    <BottomSheetContext.Provider value={value}>
      {children}
      {bottomSheetElement}
    </BottomSheetContext.Provider>
  );
}

type BottomSheetProps = PropsWithChildren & {
  title?: string;
};

function BottomSheet({ children, title }: BottomSheetProps) {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const isHeightReady = contentHeight !== null;

  useEffect(() => {
    if (isHeightReady) {
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    }
  }, [isHeightReady]);

  return (
    <html.div style={[styles.inset, styles.bottomSheetContainer]}>
      <html.div
        style={[
          styles.inset,
          styles.shade,
          !isHeightReady && styles.shadeLoading,
        ]}
      />
      <html.div style={styles.spacer} />
      <html.div
        ref={(element) => {
          if (!element) return;

          const rect = element.getBoundingClientRect();

          if (contentHeight !== rect.height) {
            setContentHeight(rect.height);
          }
        }}
        style={[
          styles.bottomSheet,
          !isHeightReady && styles.bottomSheetLoading,
          isHeightReady && styles.bottomSheetReady,
          isHeightReady && styles.bottomSheetTranslateY(contentHeight),
          isVisible && styles.bottomSheetTranslateY(0),
        ]}
      >
        <Box bg="background" borderTopLeftRadius={20} borderTopRightRadius={20}>
          {title && (
            <HStack
              justifyContent="center"
              borderColor="divider"
              borderBottomWidth={1}
              px={4}
              py={6}
            >
              <Text size="lg">{title}</Text>
            </HStack>
          )}
          <Box px={4} py={13} style={styles.bottomSheetBody}>
            {children}
          </Box>
        </Box>
      </html.div>
    </html.div>
  );
}
