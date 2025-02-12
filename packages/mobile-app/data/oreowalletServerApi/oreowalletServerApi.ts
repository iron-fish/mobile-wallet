import { CONFIRMATIONS, Network } from "../constants";
import * as Crypto from "expo-crypto";
import * as Uint8ArrayUtils from "../../utils/uint8Array";

const OREOWALLET_SERVER_URLS: Record<Network, string> = {
  [Network.MAINNET]: "https://api.oreowallet.com/",
  [Network.TESTNET]: "http://testnet.oreowallet.ironfish.network/",
};

// Currently proofs are generated locally until the published
// ironfish Rust crate supports adding proofs to an unsigned transaction.
// const OREOWALLET_PROVER_URLS: Record<Network, string> = {
//   [Network.MAINNET]: "https://prover.oreowallet.com/",
//   [Network.TESTNET]: "https://prover.oreowallet.com/",
// };

type OreowalletSuccessServerResponse<T> = {
  data: T;
  error: undefined;
  code: number;
};

type OreowalletServerResponse<T> =
  | OreowalletSuccessServerResponse<T>
  | {
      data: undefined;
      error: string;
      code: number;
    };

type ImportAccountResponse = {
  name: string;
};

type RemoveAccountResponse = {
  removed: boolean;
};

type AccountStatusResponse = {
  account: {
    name: string;
    head?: {
      hash: string;
      sequence: string;
    };
  };
};

type LatestBlockResponse = {
  currentBlockIdentifier: {
    hash: string;
    index: string;
  };
  genesisBlockIdentifier: {
    hash: string;
    index: string;
  };
};

type GetBalancesResponse = {
  account: string;
  balances: {
    assetId: string;
    assetName: string;
    confirmed: string;
    unconfirmed: string;
    pending: string;
    available: string;
  }[];
};

type GetTransactionsResponse = {
  transactions: OreowalletTransaction[];
};

type OreowalletTransaction = {
  hash: string;
  fee: string;
  type: string;
  status: string;
  blockSequence: number;
  timestamp: string;
  assetBalanceDeltas: OreowalletAssetBalanceDelta[];
};

type OreowalletAssetBalanceDelta = {
  assetId: string;
  delta: string;
  assetName: string;
};

type OreowalletTransactionDetailed = OreowalletTransaction & {
  sender: string;
  receiver: string;
  memo?: string;
  value: string;
};

type GetTransactionResponse = {
  account: string;
  transaction: OreowalletTransactionDetailed;
};

type Output = {
  publicAddress: string;
  amount: string;
  memo?: string;
  memoHex?: string;
  assetId?: string;
};

type Mint = {
  value: string;
  assetId?: string;
  name?: string;
  metadata?: string;
};

type Burn = {
  value: string;
  assetId: string;
};

type CreateTransactionResponse = {
  transaction: string;
};

type BroadcastTransactionResponse = {
  hash: string;
  accepted: boolean;
};

const LOG_REQUESTS = true;

type AccountInfo = { publicAddress: string; viewKey: string };

/**
 * Contains methods for making API requests to the Oreowallet server.
 */
class OreowalletServer {
  private viewKeyToAuthTokenCache: Map<string, string> = new Map();

  private async getAuthToken(account: AccountInfo) {
    let base64Token = this.viewKeyToAuthTokenCache.get(account.viewKey);
    if (base64Token) return base64Token;

    const hash = Uint8ArrayUtils.toHex(
      new Uint8Array(
        await Crypto.digest(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Uint8ArrayUtils.fromHex(account.viewKey),
        ),
      ),
    );
    const token = `${account.publicAddress}:${hash}`;
    base64Token = Buffer.from(token).toString("base64");
    this.viewKeyToAuthTokenCache.set(account.viewKey, base64Token);

    return base64Token;
  }

  private async fetchOreo<T>(
    url: string,
    options: {
      method: "POST" | "GET";
      account?: AccountInfo;
      body?: unknown;
    },
  ): Promise<OreowalletServerResponse<T>> {
    try {
      const fetchResult = await fetch(url, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          ...(options.account
            ? {
                Authorization: `Basic ${await this.getAuthToken(options.account)}`,
              }
            : {}),
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      });

      const responseText = await fetchResult.text();

      if (!fetchResult.ok) {
        throw new Error(responseText);
      }

      const result = JSON.parse(responseText) as OreowalletServerResponse<T>;

      if (result.error) {
        console.error(result.error);
      }

      return result;
    } catch (e: unknown) {
      console.log(url);
      console.error(e instanceof Error ? e.message : JSON.stringify(e));
      throw e;
    }
  }

  async importAccount(
    network: Network,
    account: {
      viewKey: string;
      incomingViewKey: string;
      outgoingViewKey: string;
      publicAddress: string;
      createdAt?: {
        hash: string;
        sequence: number;
      };
    },
  ): Promise<ImportAccountResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + "import";
    LOG_REQUESTS && console.log("[OreowalletServer] Calling importAccount");

    const response = await this.fetchOreo<ImportAccountResponse>(url, {
      method: "POST",
      body: account,
    });

    if (!response.data) {
      // Code for "Account already exists"
      if (response.code === 601) {
        return { name: "alreadyexists" };
      }
      throw new Error(response.error);
    }
    return response.data;
  }

  async removeAccount(
    network: Network,
    account: AccountInfo,
  ): Promise<RemoveAccountResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `remove`;
    LOG_REQUESTS && console.log("[OreowalletServer] Calling removeAccount");

    const response = await this.fetchOreo<RemoveAccountResponse>(url, {
      method: "POST",
      account,
      body: { account: account.publicAddress },
    });

    if (!response.data) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async getAccountStatus(
    network: Network,
    account: AccountInfo,
  ): Promise<AccountStatusResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `accountStatus`;

    LOG_REQUESTS && console.log("[OreowalletServer] Calling getAccountStatus");

    const response = await this.fetchOreo<AccountStatusResponse>(url, {
      method: "POST",
      account,
      body: { account: account.publicAddress },
    });

    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async rescanAccount(
    network: Network,
    account: AccountInfo,
  ): Promise<AccountStatusResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `rescan`;
    LOG_REQUESTS && console.log("[OreowalletServer] Calling rescanAccount");

    const response = await this.fetchOreo<AccountStatusResponse>(url, {
      method: "POST",
      account,
      body: { account: account.publicAddress },
    });

    if (!response.data) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async getBalances(
    network: Network,
    account: AccountInfo,
    confirmations: number = CONFIRMATIONS,
  ): Promise<GetBalancesResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `getBalances`;

    LOG_REQUESTS && console.log("[OreowalletServer] Calling getBalances");

    const response = await this.fetchOreo<GetBalancesResponse>(url, {
      method: "POST",
      account,
      body: { account: account.publicAddress, confirmations },
    });

    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async getTransactions(
    network: Network,
    account: AccountInfo,
    limit: number = 50,
  ): Promise<GetTransactionsResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `getTransactions`;
    LOG_REQUESTS && console.log("[OreowalletServer] Calling getTransactions");

    const response = await this.fetchOreo<GetTransactionsResponse>(url, {
      method: "POST",
      account,
      body: { account: account.publicAddress, limit },
    });

    if (!response.data) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async getTransaction(
    network: Network,
    account: AccountInfo,
    hash: string,
  ): Promise<OreowalletTransactionDetailed | undefined> {
    const url = OREOWALLET_SERVER_URLS[network] + `getTransaction`;
    LOG_REQUESTS && console.log("[OreowalletServer] Calling getTransaction");

    const response = await this.fetchOreo<GetTransactionResponse>(url, {
      method: "POST",
      account,
      body: { account: account.publicAddress, hash },
    });

    if (!response.data) {
      // Code for "Transaction not found for account"
      if (response.code === 611) {
        return undefined;
      }
      throw new Error(response.error);
    }
    return response.data.transaction;
  }

  async getLatestBlock(network: Network, account: AccountInfo) {
    const url = OREOWALLET_SERVER_URLS[network] + `latestBlock`;

    LOG_REQUESTS && console.log("[OreowalletServer] Calling getLatestBlock");

    const response = await this.fetchOreo<LatestBlockResponse>(url, {
      method: "GET",
      account,
    });

    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async createTransaction(
    network: Network,
    account: AccountInfo,
    transactionParameters: {
      fee?: string;
      outputs?: Output[];
      mints?: Mint[];
      burns?: Burn[];
    },
  ): Promise<CreateTransactionResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `createTx`;
    LOG_REQUESTS && console.log("[OreowalletServer] Calling createTransaction");

    const response = await this.fetchOreo<CreateTransactionResponse>(url, {
      method: "POST",
      account,
      body: {
        account: account.publicAddress,
        outputs: transactionParameters.outputs ?? [],
        mints: transactionParameters.mints ?? [],
        burns: transactionParameters.burns ?? [],
        fee: transactionParameters.fee,
      },
    });

    if (!response.data) {
      throw new Error(response.error);
    }
    return response.data;
  }

  async broadcastTransaction(
    network: Network,
    account: AccountInfo,
    transaction: string,
  ): Promise<BroadcastTransactionResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `broadcastTx`;
    LOG_REQUESTS &&
      console.log("[OreowalletServer] Calling broadcastTransaction");

    const response = await this.fetchOreo<BroadcastTransactionResponse>(url, {
      method: "POST",
      account,
      body: { transaction },
    });

    if (!response.data) {
      throw new Error(response.error);
    }
    return response.data;
  }
}

export const OreowalletServerApi = new OreowalletServer();
