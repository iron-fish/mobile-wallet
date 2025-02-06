import { StatusBar } from "expo-status-bar";
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
    href: "menu/security",
  },
  notifications: {
    title: "Notifications",
    href: "menu/notifications",
  },
  network: {
    title: "Network",
    href: "menu/network",
  },
  debug: {
    title: "Debug",
    href: "menu/debug",
  },
  about: {
    title: "About the app",
    href: "menu/about",
  },
} as const;

export const menuItems = Object.values(MENU_ROUTES).map((item) => {
  return {
    title: item.title,
    href: item.href,
    path: item.href.concat("/index"),
  };
});

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
      <StatusBar style="auto" />
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
