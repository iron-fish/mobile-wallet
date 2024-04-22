import { generateKey } from "ironfish-native-module";
import { WalletDb } from "./db";
import { AccountFormat, encodeAccount } from "@ironfish/sdk";

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

    return await this.state.db.createAccount(name, viewOnlyAccount)
  }

  async getAccounts() {
    if (this.state.type !== 'STARTED') {
      throw new Error('Wallet is not started');
    }

    return this.state.db.getAccounts();
  }
}

export const wallet = new Wallet();