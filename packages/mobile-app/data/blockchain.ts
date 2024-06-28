import { LightBlock } from "./api/lightstreamer";
import { WalletServerApi } from "./api/walletServer";
import { Network } from "./constants";
import * as Uint8ArrayUtils from '../utils/uint8Array';
import { RecentBlocks } from "./recentBlocks";
import { WalletServerChunksApi } from "./api/walletServerChunks";

/**
 * Uses WalletServerApi and WalletServerChunksApi to download blocks from the wallet server
 * (or read them from the cache), returning them in order to the caller.
 */
class BlockchainClass {
    private async readWalletServerBlocks(blocks: Array<string>, onBlock: (block: LightBlock) => unknown): Promise<void> {
        for (const serverBlock of blocks) {
            const block = LightBlock.decode(Uint8ArrayUtils.fromHex(serverBlock))
            await onBlock(block)
        }
    }

    private isRequesting = false
    
    async lockRequest(cb: () => Promise<void>) {
        if (this.isRequesting) {
            console.warn('already requesting')
            return
        }

        this.isRequesting = true
        try {
            await cb()
        } finally {
            this.isRequesting = false
        }
    }

    /**
     * Returns a list of blocks to remove from the given block to the nearest common ancestor (aka the fork point)
     * with the wallet server. If the block is on the wallet server's main chain, returns { needsReset: false, blocksToRemove: [] }
     * If no path is found, returns { needsReset: true }
     */
    async iterateFrom(network: Network, block: { hash: Uint8Array, sequence: number }): Promise<{ needsReset: false; blocksToRemove: LightBlock[]; } | { needsReset: true; }> {
        let serverBlock = await WalletServerApi.getBlockBySequence(network, block.sequence)
        if (Uint8ArrayUtils.areEqual(serverBlock.hash, block.hash)) {
            return { needsReset: false, blocksToRemove: [] }
        }

        let currentBlock = await RecentBlocks.getRecentBlock(network, block.sequence)
        if (currentBlock === null || !Uint8ArrayUtils.areEqual(currentBlock.hash, block.hash)) {
            console.log('iterateFrom: Block does not match 1:', block.sequence)
            return { needsReset: true }
        }

        let nextSequence = block.sequence - 1
        const blocksToRemove = []

        while (nextSequence > 0) {
            blocksToRemove.push(currentBlock)

            serverBlock = await WalletServerApi.getBlockBySequence(network, nextSequence)

            if (Uint8ArrayUtils.areEqual(serverBlock.hash, currentBlock.previousBlockHash)) {
                return { blocksToRemove, needsReset: false }
            }

            let prevBlock = await RecentBlocks.getRecentBlock(network, nextSequence)
            if (!prevBlock) {
                // TODO: Try asking the wallet server for the block by hash?
                console.error('No prev block found for', nextSequence)
                return { needsReset: true }
            }

            console.log('cur', currentBlock.sequence, currentBlock.previousBlockHash)
            console.log('prev', prevBlock.sequence, prevBlock.hash)
            if (!Uint8ArrayUtils.areEqual(prevBlock.hash, currentBlock.previousBlockHash)) {
                console.error('Discontinuous block found for', nextSequence)
                return { needsReset: true }
            }

            currentBlock = prevBlock
            nextSequence--
        }

        console.error('No block found before', nextSequence)
        return { needsReset: true }
    }

    /**
     * Iterates over blocks from start to end, downloading them from the wallet server if necessary and calling onBlock for each block.
     */
    async iterateTo(network: Network, start: { hash: Uint8Array, sequence: number }, end: { hash: Uint8Array, sequence: number}, onBlock: (block: LightBlock) => unknown) {
        await this.lockRequest(async () => {   
            const manifest = await WalletServerChunksApi.getChunksManifest(network)
    
            let readPromise = Promise.resolve()

            let lastHash: null | Uint8Array = null

            const onBlockInner = (block: LightBlock) => {
                // TODO: Errors thrown here don't propagate
                if (!lastHash && !Uint8ArrayUtils.areEqual(block.hash, start.hash)) {
                    console.error('!!! STARTING BLOCK MISMATCH !!!', block.hash, start.hash, block.previousBlockHash, lastHash)
                    throw new Error('Chain mismatch')
                }
                if ((lastHash && !Uint8ArrayUtils.areEqual(block.previousBlockHash, lastHash))) {
                    console.error('!!! CHAIN MISMATCH !!!', block.hash, start.hash, block.previousBlockHash, lastHash)
                    throw new Error('Chain mismatch')
                }

                lastHash = block.hash

                RecentBlocks.writeRecentBlock(network, block, end.sequence)

                onBlock(block)
            }
    
            const finalizedChunks = manifest.chunks.filter(chunk => chunk.finalized && chunk.range.end >= start.sequence && chunk.range.start <= end.sequence)
            for (const chunk of finalizedChunks) {
                await WalletServerChunksApi.getChunkBlockAndByteRanges(network, chunk)
                readPromise = readPromise.then(async () => {
                    await WalletServerChunksApi.readChunkBlocks(network, chunk, start.sequence, onBlockInner)
                })
            }
    
            const serverStart = (finalizedChunks.at(-1)?.range.end ?? start.sequence - 1) + 1
            const lastSequence = end.sequence
            const downloadSize = 100
    
            for (let i = serverStart; i <= lastSequence; i += downloadSize) {
                const endIndex = Math.min(i + downloadSize - 1, lastSequence)
                console.log('fetching blocks from wallet server', i, endIndex)
                const download = await WalletServerApi.getBlockRange(network, i, endIndex)
                readPromise = readPromise.then(async () => {
                    await this.readWalletServerBlocks(download, onBlockInner)
                })
            }
    
            await readPromise
        })
    }
}

export const Blockchain = new BlockchainClass();
