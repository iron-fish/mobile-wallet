import { generateKey } from "ironfish-native-module";
import { WalletDb } from "./db";
import { AccountFormat, LanguageKey, decodeAccount, encodeAccount } from "@ironfish/sdk";

type StartedState = { type: 'STARTED', db: WalletDb }
type WalletState = { type: 'STOPPED' } | { type: 'LOADING' } | StartedState

function assertStarted(state: WalletState): asserts state is StartedState {
  if (state.type !== 'STARTED') {
    throw new Error('Wallet is not started');
  }
}

class Wallet {
  state: WalletState = { type: 'STOPPED' };

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
    assertStarted(this.state)

    const key = generateKey();
    return await this.state.db.createAccount({
      // TODO: support account birthdays on new accounts
      createdAt: null,
      spendingKey: key.spendingKey,
      incomingViewKey: key.incomingViewKey,
      outgoingViewKey: key.outgoingViewKey,
      proofAuthorizingKey: key.proofAuthorizingKey,
      publicAddress: key.publicAddress,
      version: 4,
      viewKey: key.viewKey,
      name,
    });
  }

  async getAccount(name: string) {
    assertStarted(this.state)

    return this.state.db.getAccount(name);
  }

  async getAccounts() {
    assertStarted(this.state)

    return this.state.db.getAccounts();
  }

  async exportAccount(name: string, format: AccountFormat, options?: { viewOnly?: boolean; language?: LanguageKey }) {
    assertStarted(this.state)

    const account = await this.state.db.getAccount(name);
    if (account == null) {
      throw new Error(`No account found with name ${name}`)
    }

    const decodedAccount = decodeAccount(account.viewOnlyAccount, {
      name,
    });

    if (!account.viewOnly && !options?.viewOnly) {
      decodedAccount.spendingKey = await this.state.db.getSpendingKey(account.publicAddress)
    }

    return encodeAccount(decodedAccount, format, {
      language: options?.language,
    })
  }

  async importAccount(account: string, name?: string) {
    assertStarted(this.state)

    const decodedAccount = decodeAccount(account, {
      name,
    });

    return await this.state.db.createAccount(decodedAccount)
  }

  async renameAccount(name: string, newName: string) {
    assertStarted(this.state)

    await this.state.db.renameAccount(name, newName)
  }

  async removeAccount(name: string) {
    assertStarted(this.state)

    await this.state.db.removeAccount(name)
  }
}

export const wallet = new Wallet();