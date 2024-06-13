/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */
import { LightBlock } from './api/lightstreamer'
import { Network } from './constants'
import * as WalletServerApi from "./api/walletServer";
import { syncer } from './syncer';
import { areUint8ArraysEqual } from 'uint8array-extras';

/**
 * This is used to get a non synchronous chain of block events from the blockchain
 * As blocks are added and removed, this system will call onAdd() and onRemove() in
 * a guaranteed correct order. If you have this chain:
 *      G -> A1
 *
 * You'll get
 *  - onAdd(G)
 *  - onAdd(A1)
 *
 * If you then reorg and have received
 *      G -> A1
 *        -> B1 -> B2
 *
 * - onAdd(G)
 * - onAdd(A1)
 * - onRemove(A1)
 * - onAdd(B1)
 * - onAdd(B2)
 */
export class ChainProcessor {
    readonly network: Network
    head: Readonly<{ hash: Uint8Array, sequence: number }> | null = null
    onAdd: (block: LightBlock) => unknown
    onRemove: (block: LightBlock) => unknown

    constructor(options: {
        network: Network
        onAdd: (block: LightBlock) => unknown,
        onRemove: (block: LightBlock) => unknown,
    }) {
        this.network = options.network
        this.onAdd = options.onAdd
        this.onRemove = options.onRemove
    }

    async update({ signal }: { signal?: AbortSignal } = {}): Promise<{ hashChanged: boolean }> {
         const oldHash = this.head

        if (!this.head) {
            const genesisBlock = await WalletServerApi.getBlockBySequence(this.network, 1)
            this.onAdd(genesisBlock)
            this.head = { hash: genesisBlock.hash, sequence: genesisBlock.sequence }
        }

        // Freeze this value in case it changes while we're updating the head
        const latest = await WalletServerApi.getLatestBlock(this.network)
        const chainHead = { hash: Buffer.from(latest.hash, 'hex'), sequence: latest.sequence }

        if (areUint8ArraysEqual(chainHead.hash, this.head.hash)) {
            return { hashChanged: false }
        }

        await syncer.iterateTo(this.network, this.head, chainHead, (block) => {
            this.onAdd(block)
            this.head = { hash: block.hash, sequence: block.sequence }
        })

        // const block = await WalletServerApi.getBlockBySequence(this.network, this.head.sequence)

        // if (block) {
        //     const lightBlock = LightBlock.decode(block)
        //     if (lightBlock.hash !== this.head.hash) {
        //         // roll back blocks to fork
        //     }
        // }

        //  const fork = await this.chain.findFork(head, chainHead)

        // All cases can be handled by rewinding to the fork point
        // and then fast-forwarding to the destination. In cases where `head` and `chainHead`
        // are on the same linear chain, either rewind or fast-forward will just be a no-op
        //  const iterBackwards = this.chain.iterateFrom(head, fork, undefined, false)

        //  for await (const remove of iterBackwards) {
        //    if (signal?.aborted) {
        //      return { hashChanged: !oldHash || !this.hash.equals(oldHash) }
        //    }

        //    if (remove.hash.equals(fork.hash)) {
        //      continue
        //    }

        //    await this.remove(remove)
        //    this.hash = remove.previousBlockHash
        //    this.sequence = remove.sequence - 1
        //  }

        //  const iterForwards = this.chain.iterateTo(fork, chainHead, undefined, false)

        //  for await (const add of iterForwards) {
        //    if (signal?.aborted) {
        //      return { hashChanged: !oldHash || !this.hash.equals(oldHash) }
        //    }

        //    if (add.hash.equals(fork.hash)) {
        //      continue
        //    }

        //    await this.add(add)
        //    this.hash = add.hash
        //    this.sequence = add.sequence
        //  }

        return { hashChanged: !oldHash || this.head.hash !== oldHash.hash }
    }
}
