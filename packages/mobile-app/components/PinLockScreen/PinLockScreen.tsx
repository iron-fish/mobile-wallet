import { useFacade } from "@/data/facades";
import {
  SafeAreaView,
  View,
  AppState,
  AppStateStatus,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { PinInputComponent } from "../PinInputComponent";
import { Button, Modal, Card, Text } from "@ui-kitten/components";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSegments } from "expo-router";

const LOCK_TIMEOUT = 60 * 1000 * 5; // 5 minutes of inactivity

export function PinLockScreen({ children }: { children?: React.ReactNode }) {
  const facade = useFacade();
  const appSettings = facade.getAppSettings.useQuery();
  const setAppSetting = facade.setAppSetting.useMutation();
  const removeAllAccounts = facade.removeAllAccounts.useMutation();
  const pin = appSettings.data?.pin;
  const segments = useSegments();
  const inOnboarding = segments[0] === "onboarding";

  const [isLocked, setIsLocked] = useState(true);
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const lastActiveTimestamp = useRef(Date.now());
  const lockTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (pin === "" || inOnboarding) {
      setIsLocked(false);
    }
  }, [pin, inOnboarding]);

  const resetLockTimeout = useCallback(() => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }
    if (!isLocked) {
      lockTimeoutRef.current = setTimeout(() => {
        setIsLocked(true);
      }, LOCK_TIMEOUT);
    }
    lastActiveTimestamp.current = Date.now();
  }, [isLocked]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          // When app comes to foreground, check if we should lock
          const timeSinceLastActive = Date.now() - lastActiveTimestamp.current;
          if (timeSinceLastActive >= LOCK_TIMEOUT && !inOnboarding) {
            setIsLocked(true);
          }
          resetLockTimeout();
        } else if (nextAppState === "background") {
          // When app goes to background, update last active time
          lastActiveTimestamp.current = Date.now();
          if (lockTimeoutRef.current) {
            clearTimeout(lockTimeoutRef.current);
          }
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isLocked, resetLockTimeout, inOnboarding]);

  // Initial setup of the lock timer
  useEffect(() => {
    resetLockTimeout();
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, [isLocked, resetLockTimeout]);

  const handleForgotPin = async () => {
    try {
      // Remove the PIN
      await setAppSetting.mutateAsync({
        key: "pin",
        value: "",
      });

      // Remove all accounts
      await removeAllAccounts.mutateAsync(undefined);

      // Unlock the screen
      setIsLocked(false);
      setEnteredPin("");
      setError(null);
      setShowForgotPinModal(false);
    } catch (err) {
      console.error("Error resetting app:", err);
      setError("Failed to reset app. Please try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={resetLockTimeout}>
      <View style={styles.container}>
        {children}

        {/* Lock screen overlay */}
        {!!pin &&
          isLocked &&
          !inOnboarding &&
          process.env.EXPO_PUBLIC_DISABLE_PIN_LOCK !== "true" && (
            <View style={styles.lockOverlay}>
              <SafeAreaView style={styles.lockContent}>
                <View style={styles.pinContainer}>
                  <PinInputComponent
                    pinLength={pin.length}
                    onPinChange={setEnteredPin}
                    promptText="Enter your PIN"
                    value={enteredPin}
                    error={error}
                    setError={setError}
                  />
                  <View style={styles.buttonContainer}>
                    <Button
                      onPress={() => {
                        if (enteredPin === pin) {
                          setIsLocked(false);
                          setEnteredPin("");
                          setError(null);
                          resetLockTimeout();
                        } else {
                          setError("Incorrect PIN");
                          setEnteredPin("");
                        }
                      }}
                      disabled={enteredPin.length !== pin.length}
                    >
                      Unlock
                    </Button>
                    <Button
                      appearance="ghost"
                      status="basic"
                      onPress={() => setShowForgotPinModal(true)}
                    >
                      Forgot PIN?
                    </Button>
                  </View>
                </View>
              </SafeAreaView>
            </View>
          )}

        {/* Forgot PIN Modal */}
        <Modal
          visible={showForgotPinModal}
          backdropStyle={styles.backdrop}
          onBackdropPress={() => setShowForgotPinModal(false)}
        >
          <Card disabled style={styles.modalCard}>
            <Text category="h6" style={styles.modalTitle}>
              Reset App
            </Text>
            <Text style={styles.modalText}>
              Resetting your PIN will delete all accounts from this device. You
              will need to import your accounts again.
            </Text>
            <Text style={styles.modalText}>
              Are you sure you want to continue?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                status="basic"
                appearance="ghost"
                onPress={() => setShowForgotPinModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                status="danger"
                onPress={handleForgotPin}
                style={styles.modalButton}
              >
                Reset App
              </Button>
            </View>
          </Card>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
  },
  lockContent: {
    flex: 1,
  },
  pinContainer: {
    flex: 1,
    padding: 32,
    gap: 32,
    justifyContent: "center",
  },
  buttonContainer: {
    gap: 16,
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalCard: {
    margin: 16,
    minWidth: 300,
  },
  modalTitle: {
    textAlign: "center",
    marginBottom: 16,
  },
  modalText: {
    textAlign: "center",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
