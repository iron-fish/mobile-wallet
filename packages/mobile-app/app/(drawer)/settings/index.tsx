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
    href: "/(drawer)/settings/security",
  },
  network: {
    title: "Network",
    href: "/(drawer)/settings/network",
  },
  debug: {
    title: "Debug",
    href: "/(drawer)/settings/debug",
  },
  about: {
    title: "About the app",
    href: "/(drawer)/settings/about",
  },
} as const;

const menuItems = Object.values(MENU_ROUTES).map((item) => {
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
