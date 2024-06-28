import * as FileSystem from 'expo-file-system';
import { Network } from './constants';
import { LightBlock } from './api/lightstreamer';
import * as Uint8ArrayUtils from '../utils/uint8Array';

/**
 * Caches the latest blocks for a network ("latest" meaning blocks within a certain sequence of the wallet server's
 * most recent block). This is used in case an account head ends up on a fork -- we need to have the forked blocks
 * in order to iterate back to the common ancestor, and the wallet server may not have them.
 */
export class RecentBlocks {
    private static readonly MAX_LATEST_BLOCKS = 50;

    private static async getRecentBlocksDir(network: Network): Promise<string> {
        const directory = FileSystem.documentDirectory + `latest-blocks/${network.toString()}/`;
        try {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true })
        } catch (e) {
            console.log(e)
        }
        return directory
    }

    static async writeRecentBlock(network: Network, block: LightBlock, latestSequence: number): Promise<void> {
        // Skip if the block is far from the known latest sequence
        if (block.sequence < latestSequence - this.MAX_LATEST_BLOCKS) {
            return
        }

        const directory = await this.getRecentBlocksDir(network)
        const files = (await FileSystem.readDirectoryAsync(directory)).filter(file => file.endsWith('.block'))

        if (files.length > this.MAX_LATEST_BLOCKS) {
            try {
                await Promise.all(
                    files
                        .map((file) => parseInt(file.replace('.block', '')))
                        .sort((a, b) => a - b)
                        .slice(0, files.length - this.MAX_LATEST_BLOCKS)
                        .map((file) => FileSystem.deleteAsync(directory + file + '.block'))
                )
            } catch {}
        }

        const fileUri = directory + `${block.sequence}.block`
        await FileSystem.writeAsStringAsync(fileUri, Uint8ArrayUtils.toHex(LightBlock.encode(block).finish()), {
            encoding: FileSystem.EncodingType.UTF8,
        })
    }

    static async getRecentBlock(network: Network, sequence: number): Promise<LightBlock | null> {
        const directory = await this.getRecentBlocksDir(network)

        const fileInfo = await FileSystem.getInfoAsync(directory + `${sequence}.block`)
        if (!fileInfo.exists) {
            return null
        }

        const fileContents = await FileSystem.readAsStringAsync(directory + `${sequence}.block`, {
            encoding: FileSystem.EncodingType.UTF8,
        })
        return LightBlock.decode(Uint8ArrayUtils.fromHex(fileContents))
    }
}
