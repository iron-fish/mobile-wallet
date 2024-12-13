import {
  useState,
  useRef,
  KeyboardEvent,
  ClipboardEvent,
  useEffect,
} from "react";
import { html, css } from "react-strict-dom";
import { Icon } from "../Icon/Icon";
import { Text } from "@/components/Text/Text";
import { colors } from "@/vars/colors.stylex";

const styles = css.create({
  container: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "space-around",
    flexDirection: "row",
    position: "relative",
    width: "100%",
  },
  input: {
    height: 36,
    width: 24,
    borderColor: "transparent",
    textAlign: "center",
    fontSize: 16,
    borderWidth: 1,
    borderStyle: "solid",
    color: colors.textPrimary,
    borderRadius: "50%",
  },
  inputContainer: {
    display: "flex",
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputFocused: {
    // outline: "none",
  },
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    // whiteSpace: "nowrap",
    borderWidth: 0,
    opacity: 0.015,
  },
  inputFilled: {
    color: "orchid",
  },
  eyeIcon: {
    borderColor: "transparent",
    cursor: "pointer",
    borderRadius: "50%",
    padding: 8,
    ":hover": {
      backgroundColor: colors.backgroundHover,
    },
    ":active": {
      backgroundColor: colors.backgroundActive,
    },
  },
});

type PinInputProps = {
  pinLength?: number;
  pinValue: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
};

const MASKING_ICON = "●";

export function PinInput({
  pinLength = 8,
  pinValue,
  onChange,
  "aria-label": ariaLabel = "PIN input",
}: PinInputProps) {
  const [displayValues, setDisplayValues] = useState<string[]>([]);
  const [showPin, setShowPin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const maskTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // We need to run masking whenever the showPin state changes
  useEffect(() => {
    if (!displayValues.length && pinValue) {
      handleMasking("", pinValue);
    }
  });

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index: number, inputValue: string) => {
    const isBackspace = inputValue === "";
    if (!/^\d*$/.test(inputValue) && !isBackspace) return;
    console.log("running handleChange and isBackspace", isBackspace);
    if (isBackspace) {
      // Remove last character from pinValue and set it
      const newPinValue = pinValue.slice(0, -1);
      onChange(newPinValue);
      console.log("newPinValue", newPinValue);
      handleMasking(inputValue, newPinValue);
      focusInput(index);
    } else {
      const newPinValue = pinValue + inputValue;
      // Set displayValues to an array of MASKING_ICON with the last item as inputValue
      handleMasking(inputValue, newPinValue);
      // Update pinValue and displayValues
      onChange(newPinValue);
      if (index < pinLength - 1) {
        focusInput(index + 1);
      }
    }
  };

  const handleMasking = (
    inputValue: string,
    pin: string,
    currentShowPin: boolean = showPin,
  ) => {
    if (!currentShowPin) {
      if (inputValue) {
        const newDisplayValues = [
          ...Array(pin.length < 2 ? 0 : pin.length - 1).fill(MASKING_ICON),
          inputValue,
        ];
        setDisplayValues(newDisplayValues);
        handleMaskTimeout(newDisplayValues);
      } else {
        setDisplayValues(Array(pin.length).fill(MASKING_ICON));
      }
    } else {
      setDisplayValues(pin.split(""));
    }
  };

  // This allows the last input value to display for a short period of time
  // also cancels any previous timeout to prevent content flashing
  const handleMaskTimeout = (newDisplayValues: string[]) => {
    if (maskTimeoutRef.current) {
      clearTimeout(maskTimeoutRef.current);
    }
    maskTimeoutRef.current = setTimeout(() => {
      setDisplayValues(Array(newDisplayValues.length).fill(MASKING_ICON));
    }, 300);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && index > 0) {
      console.log("running handleKeyDown and isBackspace", index);
      handleChange(index - 1, "");
    }
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, pinLength);
    if (!/^\d*$/.test(pastedData)) return;
    onChange(pastedData.padEnd(pinLength, ""));
  };

  return (
    <>
      <html.div>
        <Text>InputValue: {pinValue}</Text>
        <Text>DisplayValues: {displayValues.join("")}</Text>
        <Text>showPin: {showPin ? "true" : "false"}</Text>
      </html.div>
      <html.div style={styles.container} role="group" aria-label={ariaLabel}>
        <html.input
          type="password"
          inputMode="numeric"
          style={styles.visuallyHidden}
          aria-hidden={true}
          onPaste={handlePaste}
        />
        <html.div style={styles.inputContainer}>
          {Array.from({ length: pinLength }).map((_, index) => {
            const inputValue = displayValues?.[index] || "";
            return (
              <html.input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                placeholder={MASKING_ICON}
                inputMode="numeric"
                maxLength={1}
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  console.log("running onChange");
                  handleChange(index, e.target.value);
                }}
                onKeyDown={(e) => {
                  // The onChange event will handle the backspace case if a value exists
                  if (!inputValue) {
                    handleKeyDown(index, e as KeyboardEvent);
                  }
                }}
                onFocus={() => {
                  let nextAvailableInput;

                  if (!pinValue) {
                    nextAvailableInput = inputRefs.current[0];
                  } else if (pinValue.length < pinLength) {
                    nextAvailableInput = inputRefs.current[pinValue.length];
                  } else {
                    nextAvailableInput = inputRefs.current[pinLength];
                  }
                  if (nextAvailableInput) {
                    nextAvailableInput.focus();
                  }
                }}
                style={[styles.input, styles.inputFilled]}
                aria-label={`Pin location ${index + 1}`}
              />
            );
          })}
          <html.button
            onClick={() => {
              const newShowPin = !showPin;
              setShowPin(newShowPin);
              handleMasking("", pinValue, newShowPin);
            }}
            aria-label={showPin ? "Show PIN" : "Hide PIN"}
            style={styles.eyeIcon}
          >
            <Icon name={showPin ? "eye-slash" : "eye"} />
          </html.button>
        </html.div>
      </html.div>
    </>
  );
}

export default PinInput;
