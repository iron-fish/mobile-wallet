import { generateKey } from "ironfish-native-module";
import { WalletDb } from "./db";
import { AccountFormat, LanguageKey, decodeAccount, encodeAccount } from "@ironfish/sdk";
import { ChainProcessor } from "../chainProcessor";
import { Network } from "../constants";
import { areUint8ArraysEqual } from "uint8array-extras";

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

  async scan(network: Network): Promise<boolean> {
    assertStarted(this.state)

    let blockProcess = Promise.resolve()
    let finished = false
    let map = new Map<number, { hash: Uint8Array, sequence: number }>()

    // todo: lock scanning

    const accounts = await this.state.db.getAccounts()
    const accountHeads = await this.state.db.getAccountHeads(network)
    for (const h of accountHeads) {
      map.set(h.accountId, { hash: h.hash, sequence: h.sequence })
    }

    let earliestHead = await this.state.db.getEarliestHead(network)
    console.log('earliestHead', earliestHead)
    const chainProcessor = new ChainProcessor({ network, onAdd: (block) => {
      blockProcess = blockProcess.then(() => {
        assertStarted(this.state)

        const prevHash = block.previousBlockHash
  
        for (const account of accounts) {
          const h = map.get(account.id)?.hash ?? null

          if (h === null || areUint8ArraysEqual(h, prevHash)) {
            // TODO: Implement connect block
            map.set(account.id, { hash: block.hash, sequence: block.sequence })
          }
        }
      })
    }, onRemove: (block) => {
      console.warn('not supported')
    } })

    const saveLoop = async () => {
      assertStarted(this.state)
      console.log('in save loop')

      for (const [k, v] of map) {
        console.log('updating', k, v)
        await this.state.db.updateAccountHead(k, network, v.sequence, v.hash)
      }

      if (!finished) {
        console.log('requeuing')
        setTimeout(saveLoop, 1000)
      }
    }
    setTimeout(saveLoop, 1000)


    chainProcessor.head = earliestHead

    const hashChanged = (await chainProcessor.update()).hashChanged
    await blockProcess
    console.log('finished!')
    finished = true
    return hashChanged
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

  async getAccountHeads(network: Network) {
    assertStarted(this.state)

    return this.state.db.getAccountHeads(network);
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