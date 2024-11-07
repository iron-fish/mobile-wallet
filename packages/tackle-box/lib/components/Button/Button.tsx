import { html, css } from "react-strict-dom";

const styles = css.create({
  button: {
    backgroundColor: {
      default: "#000",
      ":hover": "lightblue",
      ":focus": "mediumpurple",
      ":active": "pink",
    },
    color: "white",
    textAlign: "center",
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 24,
    paddingRight: 24,
    fontSize: 20,
    borderRadius: 9999,
  },
});

type Props = {
  message: string;
};

export function Button({ message }: Props) {
  console.log({ message });
  return (
    <html.button style={styles.button}>{`Click me: ${message}`}</html.button>
  );
}
