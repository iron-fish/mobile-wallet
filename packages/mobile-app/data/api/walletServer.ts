import { Network } from "../constants"
import { LightBlock } from "./lightstreamer"

const WALLET_SERVER_URLS: Record<Network, string> = {
    [Network.MAINNET]: 'http://walletserver.ironfish.network/',
    [Network.TESTNET]: 'http://testnet.walletserver.ironfish.network/',
}

type GetLatestBlockResponse = {
    sequence: number
    hash: string
}

export async function getLatestBlock(network: Network): Promise<GetLatestBlockResponse> {
    console.log('requesting latest block')
    const url = WALLET_SERVER_URLS[network] + 'latest-block'
    return await fetch(url).then(r => {
        return r.json()
    })
}

export async function getBlockByHash(network: Network, hash: string): Promise<LightBlock> {
    const url = WALLET_SERVER_URLS[network] + `block?hash=${hash}`
    return await fetch(url).then(async r => {
        const json = await r.json()
        return LightBlock.decode(Buffer.from(json, 'hex'))
    })
}

export async function getBlockBySequence(network: Network, sequence: number): Promise<LightBlock> {
    const url = WALLET_SERVER_URLS[network] + `block?sequence=${sequence}`
    console.log('requesting block', sequence, url)
    return await fetch(url).then(async r => {
        const json = await r.json()
        return LightBlock.decode(Buffer.from(json, 'hex'))
    })
}

export async function getBlockRange(network: Network, start: number, end: number): Promise<Array<string>> {
    const url = WALLET_SERVER_URLS[network] + `block-range?start=${start}&end=${end}`
    return await fetch(url).then(r => {
        return r.json()
    })
}
