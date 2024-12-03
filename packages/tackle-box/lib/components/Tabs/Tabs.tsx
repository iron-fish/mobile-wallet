import { Box } from "@/components/Box/Box";
import { HStack } from "@/components/Stack/Stack";
import { createContext, ReactNode, useContext, useState } from "react";
import { css, html } from "react-strict-dom";
import { Text } from "@/components/Text/Text";

const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
}>({
  activeTab: "",
  setActiveTab: () => {},
});

function useTabsContext() {
  return useContext(TabsContext);
}

type RootProps = {
  children: ReactNode;
  defaultValue?: string;
};

function Root({ children, defaultValue }: RootProps) {
  const [activeTab, setActiveTab] = useState(defaultValue ?? "");

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

type ListProps = {
  children: ReactNode;
};

function List({ children }: ListProps) {
  return (
    <HStack justifyContent="center" borderBottomWidth={1} borderColor="divider">
      {children}
    </HStack>
  );
}

type TriggerProps = {
  children: ReactNode;
  value: string;
};

const triggerStyles = css.create({
  wrapper: {
    borderWidth: 0,
    paddingLeft: 16,
    paddingRight: 16,
  },
});

function Trigger({ children, value }: TriggerProps) {
  const context = useTabsContext();
  const isActive = context.activeTab === value;

  return (
    <html.button
      onClick={() => context.setActiveTab(value)}
      style={triggerStyles.wrapper}
    >
      <Box
        borderBottomWidth={2}
        borderColor={isActive ? "textPrimary" : "transparent"}
        py={4}
      >
        <Text color={isActive ? "textPrimary" : "textSecondary"}>
          {children}
        </Text>
      </Box>
    </html.button>
  );
}

type ContentProps = {
  children: ReactNode;
  value: string;
};

function Content({ children, value }: ContentProps) {
  const context = useTabsContext();

  return context.activeTab === value ? <>{children}</> : null;
}

const Tabs = {
  Root,
  List,
  Trigger,
  Content,
};

export { Tabs };
