import { Text, CheckBox } from "@ui-kitten/components";
import { StyleSheet } from "react-native";
import Hyperlink from "react-native-hyperlink";

type TermsOfServiceProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function TermsOfService({ checked, onChange }: TermsOfServiceProps) {
  return (
    <CheckBox checked={checked} onChange={onChange}>
      <Hyperlink
        linkDefault
        linkStyle={styles.link}
        linkText={(url) =>
          url === "https://oreowallet.com/agreement"
            ? "Oreowallet Terms of Service"
            : url
        }
      >
        <Text>
          I agree to the https://oreowallet.com/agreement and agree to upload my
          view keys to the Oreowallet server.
        </Text>
      </Hyperlink>
    </CheckBox>
  );
}

const styles = StyleSheet.create({
  link: {
    color: "#2980b9",
  },
});
