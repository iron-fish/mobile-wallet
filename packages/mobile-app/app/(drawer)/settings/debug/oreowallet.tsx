import { StatusBar } from "expo-status-bar";
import { Button, StyleSheet, Text, View } from "react-native";
import { IRON_ASSET_ID_HEX, Network } from "@/data/constants";
import { OreowalletServerApi } from "@/data/oreowalletServerApi/oreowalletServerApi";
import { useFacade } from "@/data/facades";
import {
  AccountFormat,
  decodeAccount,
  RawTransactionSerde,
} from "@ironfish/sdk";

export default function MenuDebugOreowallet() {
  const facade = useFacade();
  const account = facade.getAccount.useQuery({});

  const exportAccountMutation = facade.exportAccount.useMutation();

  const getAccountInfo = async (name: string) => {
    const es = await exportAccountMutation.mutateAsync({
      name,
      format: AccountFormat.Base64Json,
      viewOnly: true,
    });

    const acc = decodeAccount(es);

    return { publicAddress: acc.publicAddress, viewKey: acc.viewKey };
  };

  return (
    <View style={styles.container}>
      <View>
        <Text>{`Account: ${account.data?.name}`}</Text>
        {account.data && (
          <>
            <Button
              onPress={async () => {
                if (!account.data) return;

                const exported = await exportAccountMutation.mutateAsync({
                  name: account.data.name,
                  format: AccountFormat.JSON,
                  viewOnly: true,
                });
                const decoded = decodeAccount(exported);

                const result = await OreowalletServerApi.importAccount(
                  Network.MAINNET,
                  {
                    viewKey: decoded.viewKey,
                    incomingViewKey: decoded.incomingViewKey,
                    outgoingViewKey: decoded.outgoingViewKey,
                    publicAddress: decoded.publicAddress,
                  },
                );
                console.log(JSON.stringify(result));
              }}
              title="Import Account"
            />
            <Button
              onPress={async () => {
                if (!account.data) return;

                const result = await OreowalletServerApi.getAccountStatus(
                  Network.MAINNET,
                  await getAccountInfo(account.data.name),
                );
                console.log(JSON.stringify(result));
              }}
              title="Get Account Status"
            />
            <Button
              onPress={async () => {
                if (!account.data) return;

                const result = await OreowalletServerApi.removeAccount(
                  Network.MAINNET,
                  await getAccountInfo(account.data.name),
                );
                console.log(JSON.stringify(result));
              }}
              title="Remove Account"
            />
            <Button
              onPress={async () => {
                if (!account.data) return;

                const result = await OreowalletServerApi.getTransactions(
                  Network.MAINNET,
                  await getAccountInfo(account.data.name),
                );
                console.log(JSON.stringify(result));
              }}
              title="Get Transactions"
            />
            <Button
              onPress={async () => {
                if (!account.data) return;

                const result = await OreowalletServerApi.createTransaction(
                  Network.MAINNET,
                  await getAccountInfo(account.data.name),
                  {
                    outputs: [
                      {
                        // TODO: Insert an address here
                        publicAddress: "",
                        amount: "100",
                        assetId: IRON_ASSET_ID_HEX,
                      },
                    ],
                  },
                );

                const txn = RawTransactionSerde.deserialize(
                  Buffer.from(result.transaction, "hex"),
                );

                console.log(JSON.stringify(txn));
              }}
              title="Create Transaction"
            />
            <Button
              onPress={async () => {
                if (!account.data) return;

                const result = await OreowalletServerApi.rescanAccount(
                  Network.MAINNET,
                  await getAccountInfo(account.data.name),
                );
                console.log(JSON.stringify(result));
              }}
              title="Rescan Account"
            />
            <Button
              onPress={async () => {
                if (!account.data) return;

                const result = await OreowalletServerApi.broadcastTransaction(
                  Network.MAINNET,
                  await getAccountInfo(account.data.name),
                  "0101000000000000000200000000000000000000000000000000000000000000000100000000000000fdf30c00779b9c6610112a2b08d97538db7665ab55bdef79f4a9a2db0e5e91c7ad46273cad88da83426e96ceb966c8602331909ab6a579b830fba45b6dca310275006e7d6710554fb750a5190adbb93768632751b48fd37cf009ad742fa8c913d5af5be0fc0e822bfc0144c054412524318a3bb561cf4bd026a36a8574d110ef577797451663f2f35d9655b7aa127af097c092d65471a1e1b990f9da3cab27ff85fa9441f2814f6c6ef2e38cb7b337577f3d22ac8d38b9d35426961da866235126a5ba254c409715d5e6680a664c510c7934d9ebee1cb265023e8c14769a6b34de5e5bc11727fce7a7a56acce579e911c8d6b63cab4269756dd33480c7e34c1140f59b81d1af53710bae78250f65db8f0fe11b2b91c8815e84146e62c5dc0322614b38098bca2701e9b86ec0eac02b3cb098166d6985ccd4a167babdde6320bd7378a1f18db685825018a6e12236cb18e51597b958d25727519494ea555c7ddc6a21ce9827f274a83a2a8bfd52516550edf6170da4a69185960a566d10143cd10c58bc088b96ad0a979fc0f25859655c0386c892a6da3e96d903c5e65ef2855b4dd2a2afd5c19d7a29b68da253031c5a8e3df2b0a012f24b8dcb04dbf66c9d8e8058c3684fc59d663f143e4df21c887e5cbd1034aeda45caf591ad07783081abd598bf34a1f24e55058b49260297a73e29c95f69d82c2f5f5193cdc2f66bf7c2a404c411d7c05e4c39d09ce53308ae492b45ebbbc36c8785a77f47790cfb52fadb0b1bbed4b269eaad5ce2005de4f96f9dc85bc846447ff4507fb457dbf91590ec117ffe27b935f6d8bd10e31adad68163fc8d15c5ec396a4528f1bc2b3381304521ce0582eac1b2fabf5f06adc79fc900578646569c8bbf4c3498465b0b7ef91a18c1bbdcf84d08c855dde1face5ba2d3e84622fbfb15b0498bd66aea19740902487372751c649603f590e12d2036e0ab115f0da2db79caa30dfdeaa3019b33e8a654b04895b9fca30e9af48605464c92b3d98f866fc3fbb84da0ff633e63de2f7e1e2bf504116d7c12f083360d8f71edf22ac41ca718676ffefe75aaabc9329a897c1f17738207ccd0a06d883aaac5e1fc1e9c71488f8c3cf13641896722ab8ae47e136eda58644a91f41ec49b50609c9818f76ff36da06268c29486f8c138f5588163b8721eda408607bf7cada51c2f4e5ea426aacb19836a4a0c06cfe9d65333d863915815c1b8d5887b3e8eecb67ca2494b3544ba3cc4c42c97d7ad1eed59ff111238008456c808874643123443ae63b2a9dd0570b709f2fe0bbf870675cbc926bdd0707474d1ee013830a66d2729e2a1a8c0076bc59728ac96e544fb74a11264ceef06ad009376aa894b80f02cffae5248e429e0cc0de50b182545797debaa65e154a5e868a1f7eb37aba6fa62107a2fc9919c71384cb49668bbeb528b0436cc10ad13a2c262d0f3565f56cb50e3c6220973279529b432ebe987b8c598b1f3ea33e40d5c056ebcbffcc9ef4e40fe43ad32a2a0650ae5bc88b3b4b34319ea9a22a57a391590053422cd7f808bcb19ab9f48165e285023f7459173945e8555b34896cd78331db5356ddd4215e6efa4a142d66c876e7ac9f224240fafc155c50bc7b9b4adc39f416565811028742b5613c62fa2bcd78bf30c4d8237c4586df435370e7703b65cdf52852f2e8ac8c7db4fcda612bb1d7b4407cf9df09bdf3be6b609061d53ee926244753a9934cfdef0c218548ad4eaaa610d0337df82c7c2a72e1432a1359fa42f074dc5184937f64622930fe607582fdde75710f7c9c1827e1b98ff4633d59eada865b02002f727f65ebada27c01a17d2d0aa7b6c93ff3efbac642e21e51bcaa2e7a40f8f688b72f11b625f8412cf3f33c0a5a4b532ed13143de3258511ae338d6dbd17bf5fc5e12b5ebb355c65454333faf8c93ca63267b54d74eab8ecac9528e1c6b6768b5cbd1dcae6dfd638c806909fecf22f9d9557c4678411504167dbca6d3435f941ef3242aa25323f7667795a0e42f0001c562cf631bbbc69459601d6689557d77bc6d504bc2b0e2c98d56bea3b624803467fe5f8bce3df1bde62b10c8729d95146cee92bb1dacb7c7b0002",
                );
                console.log(JSON.stringify(result));
              }}
              title="Broadcast Transaction"
            />
          </>
        )}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
