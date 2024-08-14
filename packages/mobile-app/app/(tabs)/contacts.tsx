import { View, Text, Button } from "react-native";

import { useFacade } from "../../data/facades";

export default function Contacts() {
  const facade = useFacade();

  const walletStatus = facade.getWalletStatus.useQuery(undefined, {
    refetchInterval: 1000,
  });

  const pauseSyncing = facade.pauseSyncing.useMutation();
  const resumeSyncing = facade.resumeSyncing.useMutation();

  return (
    <View>
      {walletStatus.data && (
        <>
          <Text>{`Scan status: ${walletStatus.data.status}`}</Text>
          <Text>{`Latest known block: ${walletStatus.data.latestKnownBlock}`}</Text>
        </>
      )}
      <Text>{}</Text>
      <Button
        onPress={async () => {
          await resumeSyncing.mutateAsync(undefined);
        }}
        title="Resume Syncing"
      />
      <Button
        onPress={async () => {
          await pauseSyncing.mutateAsync(undefined);
        }}
        title="Pause Syncing"
      />
    </View>
  );
}
