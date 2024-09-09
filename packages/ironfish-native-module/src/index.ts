// Import the native module. On web, it will be resolved to IronfishNativeModule.web.ts
// and on native platforms to IronfishNativeModule.ts
import IronfishNativeModule from "./IronfishNativeModule";

export interface Key {
  spendingKey: string;
  viewKey: string;
  incomingViewKey: string;
  outgoingViewKey: string;
  publicAddress: string;
  proofAuthorizingKey: string;
}

export function generateKey(): Key {
  return IronfishNativeModule.generateKey();
}

export function spendingKeyToWords(
  privateKey: string,
  languageCode: number,
): string {
  return IronfishNativeModule.spendingKeyToWords(privateKey, languageCode);
}

export function wordsToSpendingKey(
  words: string,
  languageCode: number,
): string {
  const result = IronfishNativeModule.wordsToSpendingKey(words, languageCode);

  // Throwing exceptions from expo modules directly logs to the console, even
  // if the warning is caught.
  if (result) {
    return result;
  } else {
    throw new Error("Failed to generate key from private key");
  }
}

export function generateKeyFromPrivateKey(privateKey: string): Key {
  const result = IronfishNativeModule.generateKeyFromPrivateKey(privateKey);

  // Throwing exceptions from expo modules directly logs to the console, even
  // if the warning is caught.
  if (result) {
    return result;
  } else {
    throw new Error("Failed to generate key from private key");
  }
}

export function isValidPublicAddress(hexAddress: string): boolean {
  return IronfishNativeModule.isValidPublicAddress(hexAddress);
}

export function unpackGzip({
  gzipPath,
  outputPath,
}: {
  gzipPath: string;
  outputPath: string;
}): Promise<boolean> {
  return IronfishNativeModule.unpackGzip(gzipPath, outputPath);
}

export function readPartialFile({
  path,
  offset,
  length,
}: {
  path: string;
  offset: number;
  length: number;
}): Promise<Uint8Array> {
  return IronfishNativeModule.readPartialFile(path, offset, length);
}

export function decryptNotesForOwner(
  encryptedNotes: string[],
  incomingHexKey: string,
): Promise<{ index: number; note: string }[]> {
  return IronfishNativeModule.decryptNotesForOwner(
    encryptedNotes,
    incomingHexKey,
  );
}

export function decryptNotesForSpender(
  encryptedNotes: string[],
  outgoingHexKey: string,
): Promise<{ index: number; note: string }[]> {
  return IronfishNativeModule.decryptNotesForSpender(
    encryptedNotes,
    outgoingHexKey,
  );
}

export function nullifier({
  note,
  position,
  viewHexKey,
}: {
  note: string;
  position: string;
  viewHexKey: string;
}): Promise<string> {
  return IronfishNativeModule.nullifier(note, position, viewHexKey);
}

export function createNote({
  owner,
  value,
  memo,
  assetId,
  sender,
}: {
  owner: Uint8Array;
  value: string;
  memo: Uint8Array;
  assetId: Uint8Array;
  sender: Uint8Array;
}): Promise<Uint8Array> {
  return IronfishNativeModule.createNote(owner, value, memo, assetId, sender);
}

export function createTransaction(
  transactionVersion: number,
  transactionFee: string,
  expirationSequence: number,
  spendComponents: {
    note: string;
    witnessRootHash: string;
    witnessTreeSize: string;
    witnessAuthPath: { side: "Left" | "Right"; hashOfSibling: string }[];
  }[],
  outputs: string[],
  spendingKey: Uint8Array,
): Promise<Uint8Array> {
  return IronfishNativeModule.createTransaction(
    transactionVersion,
    transactionFee,
    expirationSequence,
    { components: spendComponents },
    { outputs },
    spendingKey,
  );
}
