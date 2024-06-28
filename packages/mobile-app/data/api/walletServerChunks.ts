import * as FileSystem from "expo-file-system";
import { Network } from "../constants"
import { unpackGzip, readPartialFile } from "ironfish-native-module";
import { LightBlock } from "./lightstreamer";

export type Chunk = {
    blocks: string,
    byteRangesFile: string,
    timestamp: number,
    range: {
        start: number,
        end: number
    },
    finalized: boolean
}

export type ChunksManifest = {
    "chunks": Chunk[]
    "timestamp": number,
}

const LIGHT_BLOCKS_URLS: Record<Network, string> = {
    [Network.MAINNET]: 'https://lightblocks.ironfish.network/',
    [Network.TESTNET]: 'https://testnet.lightblocks.ironfish.network/',
}

/**
 * Contains methods for fetching chunks, or groups of blocks, fron an S3-compatible bucket.
 */
class WalletServerChunks {
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

        console.log('downloading manifest')
        const result = await FileSystem.downloadAsync(LIGHT_BLOCKS_URLS[network] + 'manifest.json', manifestFile)
        if (result.status !== 200) {
            console.warn('getManifest Status:', result.status)
        }
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

    /**
     * Returns an array of [sequence, start, end]
     */
    private async readRangesFile(network: Network, chunk: Chunk): Promise<[number, number, number][]> {
        const directory = await this.getChunksDir(network)
        const file = `${chunk.timestamp}.ranges.csv`

        const ranges = await FileSystem.readAsStringAsync(directory + file)
        return ranges.trim().split('\n').map(range => {
            const nums = range.split(',').map(Number)
            return [nums[0], nums[1], nums[2]]
        })
    }

    async getChunkBlockAndByteRanges(network: Network, chunk: Chunk) {
        await Promise.all([this.getChunkBlocks(network, chunk), this.getChunkByteRanges(network, chunk)])
    }

    async readChunkBlocks(network: Network, chunk: Chunk, startSequence: number, onBlock: (block: LightBlock) => unknown): Promise<void> {
        const directory = await this.getChunksDir(network)
        const file = `${chunk.timestamp}.blocks`
        const ranges = await this.readRangesFile(network, chunk)
        const blocksPerRead = 100

        let pos = 0;

        if (ranges[pos][0] < startSequence) {
            pos = startSequence - ranges[pos][0]
        }

        for (; pos < ranges.length; pos += blocksPerRead) {
            const endIndex = Math.min(pos + blocksPerRead - 1, ranges.length - 1)

            const start = ranges[pos][1]
            const end = ranges[endIndex][2]
            // TODO: start the next read while decoding
            const bytes = await readPartialFile(directory + file, start, end - start + 1)

            for (let i = pos; i <= endIndex; i++) {
                const block = LightBlock.decode(bytes.subarray(ranges[i][1] - start, ranges[i][2] - start + 1))
                await onBlock(block)
            }
        }
    }
}

export const WalletServerChunksApi = new WalletServerChunks();

