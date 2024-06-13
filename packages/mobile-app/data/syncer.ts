import * as FileSystem from "expo-file-system";
import { Chunk, ChunksManifest } from "./syncer/types";
import { LightBlock } from "./api/lightstreamer";
import { unpackGzip, readPartialFile } from "ironfish-native-module";
import * as WalletServerApi from "./api/walletServer";
import { Network } from "./constants";

const LIGHT_BLOCKS_URLS: Record<Network, string> = {
    [Network.MAINNET]: 'https://lightblocks.ironfish.network/',
    [Network.TESTNET]: 'https://testnet.lightblocks.ironfish.network/',
}


/**
 * Downloads blocks from the light-wallet server, caching them to provide to the Wallet.
 */
class Syncer {
    private async getChunksDir(network: Network): Promise<string> {
        const directory = FileSystem.cacheDirectory + `chunks/${network.toString()}/`;
        try {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true })
        } catch (e) {
            console.log(e)
        }
        return directory
    }

    async getChunksManifest(network: Network): Promise<ChunksManifest> {         
        const chunksDir = await this.getChunksDir(network)

        const manifestFile = chunksDir + 'manifest.json'
        const manifestInfo = await FileSystem.getInfoAsync(manifestFile)
        if (manifestInfo.exists) {
            const manifestString = await FileSystem.readAsStringAsync(manifestFile, { encoding: FileSystem.EncodingType.UTF8 })
            const manifest = JSON.parse(manifestString) as ChunksManifest
            const oneMinuteAsMilliseconds = 1000 * 60
            if (manifest.timestamp >= Date.now() - oneMinuteAsMilliseconds) {
                return manifest
            }
        }

        const result = await FileSystem.downloadAsync(LIGHT_BLOCKS_URLS[network] + 'manifest.json', manifestFile)
        console.log('getManifest Status:', result.status)
        const chunksString = await FileSystem.readAsStringAsync(manifestFile, {
            encoding: FileSystem.EncodingType.UTF8,
        })
        return JSON.parse(chunksString)
    }

    async getChunkBlocks(network: Network, chunk: Chunk): Promise<void> {
        const directory = await this.getChunksDir(network)
        const file = `${chunk.timestamp}.blocks`
        console.log('chunk dir', directory)

        const dirInfo = await FileSystem.getInfoAsync(directory + file)
        if (dirInfo.exists) {
            return
        }

        console.log('downloading chunk', chunk.timestamp)
        const result = await FileSystem.downloadAsync(LIGHT_BLOCKS_URLS[network] + chunk.blocks, directory + file)
        console.log('download complete', chunk.timestamp)
        if (result.status !== 200) {
            console.warn('Unhandled status code', result.status)
        }
    }

    async getChunkByteRanges(network: Network, chunk: Chunk): Promise<void> {
        const directory = await this.getChunksDir(network)
        const file = `${chunk.timestamp}.ranges.csv`

        const dirInfo = await FileSystem.getInfoAsync(directory + file)
        if (dirInfo.exists) {
            return
        }

        const result = await FileSystem.downloadAsync(LIGHT_BLOCKS_URLS[network] + chunk.byteRangesFile, directory + file + '.gz')
        if (result.status !== 200) {
            console.warn('Unhandled status code', result.status)
        }
        await unpackGzip(directory + file + '.gz', directory + file)
    }

    private async readRangesFile(network: Network, chunk: Chunk): Promise<[number, number, number][]> {
        const directory = await this.getChunksDir(network)
        const file = `${chunk.timestamp}.ranges.csv`

        const ranges = await FileSystem.readAsStringAsync(directory + file)
        return ranges.trim().split('\n').map(range => {
            const nums = range.split(',').map(Number)
            return [nums[0], nums[1], nums[2]]
        })
    }

    // Fetching blocks:
    // TODO: What to do if chunk isn't finalized?
    // * check wallet server for latest block
    // * get chunk storage manifest
    // * check chunks for range containing block. If block is in chunk:
    //   * check if chunk is already cached locally
    //   * if not, set chunk to download
    // * if block is not in chunk:
    //   * fetch from wallet server
    //

    private async getChunkBlockAndByteRanges(network: Network, chunk: Chunk) {
        await Promise.all([this.getChunkBlocks(network, chunk), this.getChunkByteRanges(network, chunk)])
    }

    private async readChunkBlocks(network: Network, chunk: Chunk, onBlock: (block: LightBlock) => unknown): Promise<void> {
        const directory = await this.getChunksDir(network)
        const file = `${chunk.timestamp}.blocks`
        const ranges = await this.readRangesFile(network, chunk)
        let blocksPerRead = 100

        for (let pos = 0; pos < ranges.length; pos += blocksPerRead) {
            const endIndex = Math.min(pos + blocksPerRead - 1, ranges.length - 1)

            const start = ranges[pos][1]
            const end = ranges[endIndex][2]
            // TODO: start the next read while decoding
            const bytes = await readPartialFile(directory + file, start, end - start + 1)

            for (let i = pos; i <= endIndex; i++) {
                const block = LightBlock.decode(bytes.subarray(ranges[i][1] - start, ranges[i][2] - start + 1))
                onBlock(block)
            }
        }
    }

    private readWalletServerBlocks(blocks: Array<string>, onBlock: (block: LightBlock) => unknown): void {
        for (const serverBlock of blocks) {
            const block = LightBlock.decode(Buffer.from(serverBlock, 'hex'))
            onBlock(block)
        }
    }

    isRequesting = false
    
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

    async iterateTo(network: Network, start: { hash: Uint8Array, sequence: number }, end: { hash: Uint8Array, sequence: number}, onBlock: (block: LightBlock) => unknown) {
        await this.lockRequest(async () => {   
            console.log('downloading manifest')
            const manifest = await this.getChunksManifest(network)
    
            let readPromise = Promise.resolve()

            let lastHash = start.hash

            const onBlockInner = (block: LightBlock) => {
                // TODO: Do this right
                if (!areUint8ArraysEqual(block.previousBlockHash, lastHash)) {
                    throw new Error('Chain mismatch')
                }
                lastHash = block.hash
                onBlock(block)
            }
    
            const finalizedChunks = manifest.chunks.filter(chunk => chunk.finalized && chunk.range.end >= start.sequence)
            for (const chunk of finalizedChunks) {
                await this.getChunkBlockAndByteRanges(network, chunk)
                readPromise = readPromise.then(async () => {
                    await this.readChunkBlocks(network, chunk, onBlockInner)
                })
            }
    
            const serverStart = (finalizedChunks.at(-1)?.range.end ?? 0) + 1
            const lastSequence = end.sequence
            const downloadSize = 100
    
            for (let i = serverStart; i < lastSequence; i += downloadSize) {
                const endIndex = Math.min(i + downloadSize - 1, lastSequence - 1)
                console.log('fetching blocks from wallet server', i, endIndex)
                const download = await WalletServerApi.getBlockRange(network, i, endIndex)
                readPromise = readPromise.then(async () => {
                    this.readWalletServerBlocks(download, onBlockInner)
                })
            }
    
            await readPromise
        })
    }
}

export const syncer = new Syncer();
