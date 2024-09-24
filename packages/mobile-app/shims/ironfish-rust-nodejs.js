/* eslint-env node */

import * as IronfishNativeModule from "ironfish-native-module";

class Asset {
  // https://github.com/iron-fish/ironfish/blob/8ee25c612383d4bd6e1e46ff709ed42604abc5f3/ironfish/src/utils/asset.ts#L10
  static nativeId() {
    return Buffer.from([
      81, 243, 58, 47, 20, 249, 39, 53, 229, 98, 220, 101, 138, 86, 57, 39, 157,
      220, 163, 213, 7, 154, 109, 18, 66, 178, 165, 136, 169, 203, 244, 76,
    ]);
  }
}

class Transaction {}

const mockIronfishRustNodejs = {
  $$typeof: undefined,
  KEY_LENGTH: 32,
  ASSET_NAME_LENGTH: 32,
  ASSET_METADATA_LENGTH: 96,
  ENCRYPTED_NOTE_LENGTH: 328,
  ENCRYPTED_NOTE_PLAINTEXT_LENGTH: 136 + 16,
  NOTE_ENCRYPTION_KEY_LENGTH: 80,
  PUBLIC_ADDRESS_LENGTH: 32,
  ASSET_ID_LENGTH: 32,
  RANDOMNESS_LENGTH: 32,
  MEMO_LENGTH: 32,
  TRANSACTION_EXPIRATION_LENGTH: 4,
  TRANSACTION_FEE_LENGTH: 8,
  TRANSACTION_PUBLIC_KEY_RANDOMNESS_LENGTH: 32,
  TRANSACTION_SIGNATURE_LENGTH: 64,
  PROOF_LENGTH: 192,
  Asset: new Proxy(Asset, {
    get: (obj, property) => {
      if (obj.hasOwnProperty(property)) {
        return obj[property];
      }
      const message = `ERROR: Please implement ${property} in shims/ironfish-rust-nodejs/Asset`;
      console.error(message);
      throw new Error(message);
    },
  }),
  Transaction: new Proxy(Transaction, {
    get: (obj, property) => {
      if (obj.hasOwnProperty(property)) {
        return obj[property];
      }
      const message = `ERROR: Please implement ${property} in shims/ironfish-rust-nodejs/Asset`;
      console.error(message);
      throw new Error(message);
    },
  }),
  spendingKeyToWords: IronfishNativeModule.spendingKeyToWords,
  wordsToSpendingKey: IronfishNativeModule.wordsToSpendingKey,
  generateKeyFromPrivateKey: IronfishNativeModule.generateKeyFromPrivateKey,
  isValidPublicAddress: IronfishNativeModule.isValidPublicAddress,
};

const proxy = new Proxy(mockIronfishRustNodejs, {
  get: (obj, property) => {
    if (obj.hasOwnProperty(property)) {
      return obj[property];
    }
    const message = `ERROR: Please implement ${property} in shims/ironfish-rust-nodejs`;
    console.error(message);
    throw new Error(message);
  },
});

module.exports = proxy;
