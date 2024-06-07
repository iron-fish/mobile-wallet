import { Network } from "../constants"

const WALLET_SERVER_URLS: Record<Network, string> = {
    [Network.MAINNET]: 'http://walletserver.ironfish.network/',
    [Network.TESTNET]: 'http://testnet.walletserver.ironfish.network/',
}

type GetLatestBlockResponse = {
    sequence: number
    hash: string
}

export async function getLatestBlock(network: Network): Promise<GetLatestBlockResponse> {
    const url = WALLET_SERVER_URLS[network] + 'latest-block'
    console.log(url)
    return await fetch(url).then(r => {
        console.log(r)
        return r.json()
    })
}