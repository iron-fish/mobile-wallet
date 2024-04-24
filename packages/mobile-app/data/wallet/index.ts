import { generateKey } from "ironfish-native-module";
import { WalletDb } from "./db";
import { AccountFormat, decodeAccount, encodeAccount } from "@ironfish/sdk";
import * as SecureStore from 'expo-secure-store'

class Wallet {
  state: { type: 'STOPPED' } | { type: 'LOADING' } | { type: 'STARTED', db: WalletDb } = { type: 'STOPPED' };

  async start() {
    if (this.state.type !== 'STOPPED') {
      throw new Error('Wallet is not stopped');
    }

    this.state = { type: 'LOADING' };

    const db = await WalletDb.init();

    this.state = { type: 'STARTED', db };
  }

  async stop() {
    this.state = { type: 'STOPPED' };
  }

  async createAccount(name: string) {
    if (this.state.type !== 'STARTED') {
      throw new Error('Wallet is not started');
    }

    const key = generateKey();

    const viewOnlyAccount = encodeAccount({
      // TODO: support account birthdays on new accounts
      createdAt: null,
      spendingKey: null,
      incomingViewKey: key.incomingViewKey,
      outgoingViewKey: key.outgoingViewKey,
      proofAuthorizingKey: key.proofAuthorizingKey,
      publicAddress: key.publicAddress,
      version: 4,
      viewKey: key.viewKey,
      name,
    }, AccountFormat.Base64Json)

    const newAccount = await this.state.db.createAccount(name, viewOnlyAccount)
    await SecureStore.setItemAsync(key.publicAddress, key.spendingKey, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: false,
    });
    return newAccount;
  }

  async getAccounts() {
    if (this.state.type !== 'STARTED') {
      throw new Error('Wallet is not started');
    }

    return this.state.db.getAccounts();
  }

  async exportAccount(name: string) {
    if (this.state.type !== 'STARTED') {
      throw new Error('Wallet is not started');
    }

    const account = await this.state.db.getAccount(name);
    if (account == null) {
      throw new Error(`No account found with name ${name}`)
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name,
    });

    decodedAccount.name = name;
    decodedAccount.spendingKey = await SecureStore.getItemAsync(decodedAccount.publicAddress, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: false,
    })
    return encodeAccount(decodedAccount, AccountFormat.JSON)
  }
}

export const wallet = new Wallet();