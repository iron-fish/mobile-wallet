const numToHex = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, "0"),
);

const hexToNum: { [key: string]: number } = {};
for (let i = 0; i < 256; i++) {
  hexToNum[i.toString(16).padStart(2, "0")] = i;
  hexToNum[i.toString(16).padStart(2, "0").toUpperCase()] = i;
}

export function toHex(a: Uint8Array): string {
  return a.reduce((string, num) => string + numToHex[num], "");
}

export function fromHex(a: string): Uint8Array {
  if (a.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }

  const bytes = new Uint8Array(Math.floor(a.length / 2));

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = hexToNum[a.slice(i * 2, i * 2 + 2)];
  }

  return bytes;
}

export function areEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}
