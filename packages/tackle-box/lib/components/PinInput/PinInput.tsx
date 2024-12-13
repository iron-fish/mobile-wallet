import { useState, useRef, KeyboardEvent, useEffect } from "react";
import { html, css } from "react-strict-dom";
import { Icon } from "../Icon/Icon";
import { colors } from "@/vars/colors.stylex";

const styles = css.create({
  container: {
    borderColor: colors.borderLight,
    borderRadius: 3,
    borderWidth: 1,
    display: "flex",
    height: 60,
    justifyContent: "space-around",
    flexDirection: "row",
    paddingInline: 16,
    position: "relative",
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
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    borderWidth: 0,
  },
  inputMasked: {
    color: "orchid",
  },
  inputUnmasked: {
    color: colors.textPrimary,
    fontSize: 36,
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

// Note: This does not support pasting
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
    if (displayValues.length !== pinValue?.length) {
      handleMasking("", pinValue);
      focusInput(pinValue.length);
    }
  });

  const handleChange = (index: number, inputValue: string) => {
    const isBackspace = inputValue === "";
    if (!/^\d*$/.test(inputValue) && !isBackspace) return;

    if (isBackspace) {
      // Remove last character from pinValue and set it
      const newPinValue = pinValue.slice(0, -1);
      onChange(newPinValue);
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

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  // Focus the next available input
  const handleOnFocus = () => {
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
  };

  return (
    <html.div style={styles.container} role="group" aria-label={ariaLabel}>
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
                handleChange(index, e.target.value);
              }}
              onKeyDown={(e) => {
                // The onChange event will handle the backspace case if a value exists
                if (!inputValue) {
                  handleKeyDown(index, e as KeyboardEvent);
                }
              }}
              onFocus={() => {
                handleOnFocus();
              }}
              style={[
                styles.input,
                showPin && inputValue
                  ? styles.inputUnmasked
                  : styles.inputMasked,
              ]}
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
        <html.div aria-live="polite" style={styles.visuallyHidden}>
          {showPin ? "PIN is visible" : "PIN is hidden"}
        </html.div>
      </html.div>
    </html.div>
  );
}

export default PinInput;
