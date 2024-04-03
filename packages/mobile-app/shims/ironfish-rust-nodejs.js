/* eslint-env node */

export const ENCRYPTED_NOTE_PLAINTEXT_LENGTH = 136 + 16;

export const NOTE_ENCRYPTION_KEY_LENGTH = 80;

export const PUBLIC_ADDRESS_LENGTH = 32;
export const ASSET_ID_LENGTH = 32;
export const RANDOMNESS_LENGTH = 32;
export const MEMO_LENGTH = 32;
export const DECRYPTED_NOTE_LENGTH = 168;

export class Asset {
  // https://github.com/iron-fish/ironfish/blob/8ee25c612383d4bd6e1e46ff709ed42604abc5f3/ironfish/src/utils/asset.ts#L10
  static nativeId() {
    return Buffer.from([
      81, 243, 58, 47, 20, 249, 39, 53, 229, 98, 220, 101, 138, 86, 57, 39, 157,
      220, 163, 213, 7, 154, 109, 18, 66, 178, 165, 136, 169, 203, 244, 76,
    ]);
  }
}
