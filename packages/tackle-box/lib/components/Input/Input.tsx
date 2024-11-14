import { useState } from "react";
import { html, css } from "react-strict-dom";
import { ComponentProps } from "react";
import { sizing, colors } from "../../vars/index.stylex";

const styles = css.create({
  container: {
    position: "relative",
  },
  input: {
    paddingInline: sizing[4],
    paddingTop: sizing[4],
    paddingBottom: sizing[4],
    fontSize: sizing[4],
    borderWidth: 1,
    borderRadius: sizing[2],
    borderStyle: "solid",
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  inputWithValue: {
    paddingBottom: sizing[2],
    paddingTop: sizing[6],
  },
  inputDisabled: {
    backgroundColor: colors.backgroundDisabled,
    color: colors.textDisabled,
  },
  label: {
    position: "absolute",
    color: colors.textSecondary,
    fontSize: sizing[4],
    left: sizing[4],
    top: sizing[4],
    pointerEvents: "none",
    transitionProperty: "transform",
    transitionDuration: "200ms",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transform: "translateY(0) scale(1)",
    transformOrigin: "left top",
  },
  labelRaised: {
    transform: `translateY(-6px) scale(0.75)`,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
});

type InputProps = ComponentProps<typeof html.input>;

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<InputProps, "onChange" | "value">;

export function Input({ label, value, onChange, ...props }: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValueOrIsFocused = !!value || isFocused;

  return (
    <html.div style={styles.container}>
      <html.label
        style={[
          styles.label,
          hasValueOrIsFocused && styles.labelRaised,
          props.disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </html.label>
      <html.input
        style={[
          styles.input,
          props.disabled && styles.inputDisabled,
          hasValueOrIsFocused && styles.inputWithValue,
        ]}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        {...props}
      />
    </html.div>
  );
}
