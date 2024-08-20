import { decodeAccount } from "@ironfish/sdk";
import { Network } from "../constants";
import { Wallet } from "../wallet/wallet";
import { WriteQueue } from "../wallet/writeQueue";
import { ReverseChainProcessor } from "./reverseChainProcessor";
import * as Uint8ArrayUtils from "../../utils/uint8Array";

/**
 * Removes blocks from wallet accounts from the latest account head
 * back to the genesis block.
 */
export async function reverseScan(
  wallet: Wallet,
  network: Network,
): Promise<boolean> {
  if (wallet.state.type !== "STARTED") {
    return false;
  }

  if (wallet.scanState.type === "SCANNING") {
    return false;
  }
  const abort = new AbortController();
  wallet.scanState = { type: "SCANNING", abort };

  const cache = new WriteQueue(wallet.state.db, network);

  let blockProcess = Promise.resolve();
  let performanceTimer = performance.now();
  let finished = false;

  const dbAccounts = await wallet.state.db.getAccounts();
  let accounts = dbAccounts.map((account) => {
    return {
      ...account,
      decodedAccount: decodeAccount(account.viewOnlyAccount, {
        name: account.name,
      }),
    };
  });
  const accountHeads = await wallet.state.db.getAccountHeads(network);
  let latestHead: { hash: Uint8Array; sequence: number } | null = null;
  for (const h of accountHeads) {
    if (
      latestHead === null ||
      (latestHead && h.sequence > latestHead.sequence)
    ) {
      latestHead = h;
    }
    cache.setHead(h.accountId, {
      hash: h.hash,
      sequence: h.sequence,
    });
  }

  if (latestHead === null) {
    console.error("No account heads found");
    wallet.scanState = { type: "IDLE" };
    return false;
  }

  const chainProcessor = new ReverseChainProcessor({
    network,
    abort: abort.signal,
    head: latestHead,
    onRemove: (block) => {
      blockProcess = blockProcess.then(() => {
        if (abort.signal.aborted) {
          return;
        }

        console.log(`Removing block ${block.sequence}`);

        for (const account of accounts) {
          const h = cache.getHead(account.id)?.hash ?? null;

          if (h && Uint8ArrayUtils.areEqual(h, block.hash)) {
            cache.removeBlock(account.id, {
              hash: block.hash,
              sequence: block.sequence,
              prevHash: block.previousBlockHash,
            });
          }
        }
      });
    },
  });

  const saveLoop = async () => {
    if (wallet.state.type !== "STARTED") {
      return;
    }

    await cache.write();

    if (!finished) {
      saveLoopTimeout = setTimeout(saveLoop, 1000);
    }
  };
  let saveLoopTimeout = setTimeout(saveLoop, 1000);

  let hashChanged = false;
  try {
    hashChanged = (await chainProcessor.update()).hashChanged;
  } finally {
    await blockProcess;
    finished = true;
    clearTimeout(saveLoopTimeout);
    await saveLoop();
    if (wallet.scanState.abort.signal.aborted) {
      wallet.scanState = wallet.scanState = wallet.scanState.abort.signal
        .aborted
        ? { type: "PAUSED" }
        : { type: "IDLE" };
    }
    console.log(`finished in ${performance.now() - performanceTimer}ms`);
  }

  return hashChanged;
}
