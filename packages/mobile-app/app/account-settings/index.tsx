import { StatusBar } from "expo-status-bar";
import {
  Icon,
  IconElement,
  Layout,
  Menu,
  MenuItem,
  Toggle,
} from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useFacade } from "../../data/facades";

const ForwardIcon = (props: any): IconElement => (
  <Icon {...props} name="arrow-ios-forward" />
);

const ACCOUNT_SETTINGS_ROUTES = {
  accountSelect: {
    title: "Account Select",
    href: "account-select",
  },
  accountName: {
    title: "Account Name",
    href: "account-settings/account-name",
  },
  exportAccount: {
    title: "Export Account",
    href: "account-settings/export-account",
  },
  removeAccount: {
    title: "Remove Account",
    href: "account-settings/remove-account",
  },
  addAccount: {
    title: "Add Account",
    href: "add-account",
  },
} as const;

export const accountSettingsRoutes = Object.values(ACCOUNT_SETTINGS_ROUTES).map(
  (item) => {
    return {
      title: item.title,
      href: item.href,
      path: item.href.concat("/index"),
    };
  },
);
function getMenuItems({
  currentAccountName,
  currentAccountBalance,
}: {
  currentAccountName: string;
  currentAccountBalance: string;
}) {
  return Object.entries(ACCOUNT_SETTINGS_ROUTES).map(([key, route]) => {
    if (key === "accountSelect") {
      return {
        title: `${currentAccountName} (${currentAccountBalance} $IRON)`,
        href: route.href,
      };
    }
    if (key === "removeAccount") {
      return {
        title: route.title,
        href: route.href.concat(`?accountName=${currentAccountName}`),
      };
    }
    return route;
  });
}

export default function AccountSettings() {
  const { accountName } = useLocalSearchParams<{ accountName: string }>();
  const router = useRouter();

  if (accountName === undefined) {
    throw new Error("accountName is required");
  }

  const facade = useFacade();
  const [hideBalances, setHideBalances] = useState(false);

  const getAccountResult = facade.getAccount.useQuery(
    { name: accountName },
    {
      refetchInterval: 1000,
    },
  );

  const menuItems = getMenuItems({
    currentAccountName: getAccountResult.data?.name ?? "Unknown",
    currentAccountBalance:
      getAccountResult.data?.balances.iron.confirmed ?? "0",
  });

  const handleSelect = (index: number) => {
    router.push(menuItems[index].href);
  };

  return (
    <>
      <Stack.Screen options={{ title: accountName }} />
      <Layout style={styles.container} level="1">
        <Menu style={styles.menu}>
          {menuItems
            .map((item, index) => (
              <MenuItem
                key={index}
                title={item.title}
                accessoryRight={ForwardIcon}
                onPress={() => handleSelect(index)}
              />
            ))
            .concat(
              <MenuItem
                key="hide-balances"
                title="Hide Balances"
                accessoryRight={() => (
                  <Toggle
                    checked={hideBalances}
                    onChange={setHideBalances}
                    style={styles.toggle}
                  />
                )}
              />,
            )}
        </Menu>
        <StatusBar style="auto" />
      </Layout>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menu: {
    flex: 1,
  },
  toggle: {
    marginRight: 8,
  },
});
