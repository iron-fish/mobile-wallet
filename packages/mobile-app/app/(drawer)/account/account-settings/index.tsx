import {
  Icon,
  IconElement,
  Layout,
  Menu,
  MenuItem,
  Toggle,
} from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useFacade } from "@/data/facades";
import { CurrencyUtils } from "@ironfish/sdk";
import { SettingsKey } from "@/data/settings/db";
import { useEffect, useState, useCallback } from "react";
import { useAccount } from "@/providers/AccountProvider";
import { SafeAreaView } from "react-native";
import { Spinner } from "@ui-kitten/components";

const ForwardIcon = (props: any): IconElement => (
  <Icon {...props} name="arrow-ios-forward" />
);

const ACCOUNT_SETTINGS_ROUTES = {
  accountSelect: {
    title: "Account Select",
    href: "/(drawer)/account/account-settings/account-select",
  },
  accountName: {
    title: "Account Name",
    href: "/(drawer)/account/account-settings/account-name",
  },
  exportAccount: {
    title: "Export Account",
    href: "/(drawer)/account/account-settings/export-account",
  },
  removeAccount: {
    title: "Remove Account",
    href: "/(drawer)/account/account-settings/remove-account",
  },
  addAccount: {
    title: "Add Account",
    href: "/(drawer)/account/account-settings/add-account",
  },
} as const;

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

function AccountSettingsContent({ accountName }: { accountName: string }) {
  const router = useRouter();
  const facade = useFacade();

  // I tried using isPending and variables on the mutation, but it was causing toggle
  // re-renders that made the toggle animation jittery.
  const appSettings = facade.getAppSettings.useQuery();
  const [hideBalances, setHideBalances] = useState(false);

  useEffect(() => {
    setHideBalances(appSettings.data?.hideBalances === "true");
  }, [appSettings.data?.hideBalances]);

  const { mutate: setAppSetting } = facade.setAppSetting.useMutation();

  const onToggleHideBalances = useCallback(
    (checked: boolean) => {
      setHideBalances(checked);
      setAppSetting({
        key: SettingsKey.HideBalances,
        value: checked ? "true" : "false",
      });
    },
    [setAppSetting],
  );

  const getAccountResult = facade.getAccount.useQuery(
    { name: accountName },
    {
      refetchInterval: 1000,
    },
  );

  const menuItems = getMenuItems({
    currentAccountName: getAccountResult.data?.name ?? "Unknown",
    currentAccountBalance: CurrencyUtils.render(
      getAccountResult.data?.balances.iron.confirmed ?? "0",
    ),
  });

  const handleSelect = (index: number) => {
    router.push(menuItems[index].href);
  };

  return (
    <>
      <Stack.Screen options={{ title: "Account Settings" }} />
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
                    onChange={onToggleHideBalances}
                  />
                )}
              />,
            )}
        </Menu>
      </Layout>
    </>
  );
}

export default function AccountSettings() {
  const { accountName, isLoading } = useAccount();

  if (isLoading) {
    return (
      <SafeAreaView>
        <Layout style={styles.container} level="1">
          <Spinner />
        </Layout>
      </SafeAreaView>
    );
  }

  if (accountName === undefined) {
    throw new Error("accountName is required");
  }

  return <AccountSettingsContent accountName={accountName} />;
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
