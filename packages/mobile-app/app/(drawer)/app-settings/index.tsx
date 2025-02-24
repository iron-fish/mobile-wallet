import { StyleSheet } from "react-native";
import {
  Icon,
  IconElement,
  Layout,
  Menu,
  MenuItem,
} from "@ui-kitten/components";
import { useRouter } from "expo-router";

const ForwardIcon = (props: any): IconElement => (
  <Icon {...props} name="arrow-ios-forward" />
);

const MENU_ROUTES = {
  security: {
    title: "Security",
    href: "/(drawer)/app-settings/security",
  },
  network: {
    title: "Network",
    href: "/(drawer)/app-settings/network",
  },
  debug: {
    title: "Debug",
    href: "/(drawer)/app-settings/debug",
  },
  about: {
    title: "About the app",
    href: "/(drawer)/app-settings/about",
  },
} as const;

const menuItems = Object.entries(MENU_ROUTES)
  .map(([key, item]) => {
    if (
      key === "debug" &&
      process.env.EXPO_PUBLIC_ENABLE_DEBUG_MENU !== "true"
    ) {
      return null;
    }

    return {
      title: item.title,
      href: item.href,
      path: item.href.concat("/index"),
    };
  })
  .filter((item) => item !== null);

export default function MenuScreen() {
  const router = useRouter();

  const handleSelect = (index: number) => {
    router.push(menuItems[index].href);
  };

  return (
    <Layout style={styles.container} level="1">
      <Menu style={styles.menu} onSelect={(index) => handleSelect(index.row)}>
        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            title={item.title}
            accessoryRight={ForwardIcon}
          />
        ))}
      </Menu>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menu: {
    flex: 1,
  },
});
