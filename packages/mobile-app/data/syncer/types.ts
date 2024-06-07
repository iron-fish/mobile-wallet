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