import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useFacade } from "@/data/facades";
import { AccountFormat } from "@ironfish/sdk";
import { Text, Modal, Card, Button } from "@ui-kitten/components";
import { setStringAsync } from "expo-clipboard";
import { useState, useRef, useEffect } from "react";

export default function ExportAccount() {
  const [modalVisible, setModalVisible] = useState(false);
  const [exportType, setExportType] = useState<AccountFormat | null>(null);
  const [exportedContent, setExportedContent] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(2);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const facade = useFacade();
  const { data, isLoading } = facade.getAccount.useQuery({});
  const exportAccount = facade.exportAccount.useMutation();

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  if (isLoading) return <Text>Loading...</Text>;
  if (!data) return <Text>No Account</Text>;

  const handleExport = async (format: AccountFormat) => {
    setExportType(format);
    setExportedContent(null);
    setHoldProgress(2);
    setModalVisible(true);
  };

  const startHoldTimer = () => {
    if (isHoldingRef.current) return;
    isHoldingRef.current = true;

    holdTimerRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev <= 1) {
          if (holdTimerRef.current) {
            clearInterval(holdTimerRef.current);
          }
          handleReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelHoldTimer = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isHoldingRef.current = false;
    setHoldProgress(2);
  };

  const handleReveal = async () => {
    if (!exportType) return;

    const acc = await exportAccount.mutateAsync({
      name: data.name,
      format: exportType,
    });
    setExportedContent(acc);
  };

  const handleCopy = async () => {
    if (exportedContent) {
      await setStringAsync(exportedContent);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setExportType(null);
    setExportedContent(null);
    cancelHoldTimer();
  };

  const getExportTypeName = (format: AccountFormat) => {
    switch (format) {
      case AccountFormat.Mnemonic:
        return "Mnemonic Phrase";
      case AccountFormat.Base64Json:
        return "Encoded Key";
      case AccountFormat.SpendingKey:
        return "Spending Key";
      default:
        return "Export";
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Export Account" }} />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text category="s1" appearance="hint" style={styles.explanationText}>
            Export your account to transition to another wallet, or to ensure
            complete control and safety of your digital assets
          </Text>
          <View style={styles.buttonContainer}>
            <Button onPress={() => handleExport(AccountFormat.Mnemonic)}>
              Mnemonic Phrase
            </Button>
            <Button onPress={() => handleExport(AccountFormat.Base64Json)}>
              Encoded Key
            </Button>
            <Button onPress={() => handleExport(AccountFormat.SpendingKey)}>
              Spending Key
            </Button>
          </View>
        </View>

        <Modal
          visible={modalVisible}
          backdropStyle={styles.backdrop}
          onBackdropPress={closeModal}
        >
          <Card disabled style={styles.modalCard}>
            {!exportedContent ? (
              <>
                <Text category="h6" style={styles.modalTitle}>
                  {`Export ${exportType ? getExportTypeName(exportType) : ""}`}
                </Text>
                <Text style={styles.modalText}>
                  Make sure you're in a private setting before revealing your{" "}
                  {exportType
                    ? getExportTypeName(exportType).toLowerCase()
                    : ""}
                  . This information is sensitive and should be kept secure.
                </Text>
                <Button
                  onPressIn={startHoldTimer}
                  onPressOut={cancelHoldTimer}
                  style={styles.modalButton}
                >
                  {`Hold to reveal (${holdProgress}s)`}
                </Button>
                <Button appearance="ghost" onPress={closeModal}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Text category="h6" style={styles.modalTitle}>
                  {`Export ${exportType ? getExportTypeName(exportType) : ""}`}
                </Text>
                <Card disabled style={styles.sensitiveContentContainer}>
                  <Text
                    selectable
                    style={styles.sensitiveContent}
                    numberOfLines={8}
                  >
                    {exportedContent || ""}
                  </Text>
                </Card>
                <Button onPress={handleCopy} style={styles.modalButton}>
                  {`Copy to clipboard`}
                </Button>
                <Button appearance="ghost" onPress={closeModal}>
                  Close
                </Button>
              </>
            )}
          </Card>
        </Modal>

        <StatusBar style="auto" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
  },
  explanationText: {
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    gap: 16,
    width: "100%",
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    margin: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  modalText: {
    textAlign: "center",
    marginBottom: 16,
  },
  modalButton: {
    marginBottom: 8,
  },
  sensitiveContentContainer: {
    marginBottom: 16,
  },
  sensitiveContent: {
    // textAlign: "center",
    fontSize: 16,
    fontFamily: "monospace",
  },
});
