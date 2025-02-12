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
import { Button } from "@ui-kitten/components";
import { useCallback, useEffect, useRef, useState } from "react";

const LOCK_TIMEOUT = 60 * 1000 * 5; // 5 minutes of inactivity

export function PinLockScreen({ children }: { children?: React.ReactNode }) {
  const facade = useFacade();
  const appSettings = facade.getAppSettings.useQuery();
  const pin = appSettings.data?.pin;

  const [isLocked, setIsLocked] = useState(true);
  const [enteredPin, setEnteredPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastActiveTimestamp = useRef(Date.now());
  const lockTimeoutRef = useRef<NodeJS.Timeout>();

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
          if (timeSinceLastActive >= LOCK_TIMEOUT) {
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
  }, [isLocked, resetLockTimeout]);

  // Initial setup of the lock timer
  useEffect(() => {
    resetLockTimeout();
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, [isLocked, resetLockTimeout]);

  const handlePinSubmit = () => {
    if (enteredPin === pin) {
      setIsLocked(false);
      setEnteredPin("");
      setError(null);
      resetLockTimeout();
    } else {
      setError("Incorrect PIN");
      setEnteredPin("");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={resetLockTimeout}>
      <View style={styles.container}>
        {children}

        {/* Lock screen overlay */}
        {!!pin && isLocked && (
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
                <Button
                  onPress={handlePinSubmit}
                  disabled={enteredPin.length !== pin.length}
                >
                  Unlock
                </Button>
              </View>
            </SafeAreaView>
          </View>
        )}
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
});
