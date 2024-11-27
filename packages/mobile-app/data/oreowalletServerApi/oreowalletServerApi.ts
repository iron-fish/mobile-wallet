import { Network } from "../constants";

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

type OreowalletServerResponse<T> =
  | {
      data: T;
      error: undefined;
      code: number;
    }
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

/**
 * Contains methods for making API requests to the Oreowallet server.
 */
class OreowalletServer {
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

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<ImportAccountResponse>;
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
    account: { address: string },
  ): Promise<RemoveAccountResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `remove`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(account),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<RemoveAccountResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async getAccountStatus(
    network: Network,
    account: { address: string },
  ): Promise<AccountStatusResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `accountStatus`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account: account.address }),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<AccountStatusResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async rescanAccount(
    network: Network,
    account: { address: string },
  ): Promise<AccountStatusResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `rescan`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account: account.address }),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<AccountStatusResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async getTransactions(
    network: Network,
    address: string,
    limit: number = 50,
  ): Promise<GetTransactionsResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `getTransactions`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account: address, limit }),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<GetTransactionsResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async getTransaction(
    network: Network,
    address: string,
    hash: string,
  ): Promise<OreowalletTransactionDetailed | undefined> {
    const url = OREOWALLET_SERVER_URLS[network] + `getTransaction`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account: address, hash }),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<GetTransactionResponse>;
    if (!response.data) {
      // Code for "Transaction not found for account"
      if (response.code === 611) {
        return undefined;
      }
      throw new Error(response.error);
    }

    return response.data.transaction;
  }

  async getLatestBlock(network: Network) {
    const url = OREOWALLET_SERVER_URLS[network] + `latestBlock`;

    const fetchResult = await fetch(url);
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<LatestBlockResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async createTransaction(
    network: Network,
    address: string,
    transactionParameters: {
      fee?: string;
      outputs?: Output[];
      mints?: Mint[];
      burns?: Burn[];
    },
  ): Promise<CreateTransactionResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `createTx`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account: address,
        outputs: transactionParameters.outputs ?? [],
        mints: transactionParameters.mints ?? [],
        burns: transactionParameters.burns ?? [],
        fee: transactionParameters.fee,
      }),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<CreateTransactionResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async broadcastTransaction(
    network: Network,
    transaction: string,
  ): Promise<BroadcastTransactionResponse> {
    const url = OREOWALLET_SERVER_URLS[network] + `broadcastTx`;

    const fetchResult = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction,
      }),
    });
    const response =
      (await fetchResult.json()) as OreowalletServerResponse<BroadcastTransactionResponse>;
    if (!response.data) {
      throw new Error(response.error);
    }

    return response.data;
  }
}

export const OreowalletServerApi = new OreowalletServer();
