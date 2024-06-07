/* eslint-disable */
import Long from "long";
import _m0 from "protobufjs/minimal";

export interface Empty {
}

export interface BlockID {
  sequence?: number | undefined;
  hash?: Buffer | undefined;
}

/**
 * BlockRange specifies a series of blocks from start to end inclusive.
 * Both BlockIDs must be sequences; specification by hash is not yet supported.
 */
export interface BlockRange {
  start?: BlockID | undefined;
  end?: BlockID | undefined;
}

export interface LightBlock {
  /** the version of this wire format, for storage */
  protoVersion: number;
  /** the height of this block */
  sequence: number;
  /** the ID (hash) of this block, same as explorer */
  hash: Buffer;
  /** the ID (hash) of this block's predecessor */
  previousBlockHash: Buffer;
  /** Unix epoch time when the block was mined */
  timestamp: number;
  /** zero or more compact transactions from this block */
  transactions: LightTransaction[];
  /** the size of the notes tree after adding transactions from this block. */
  noteSize: number;
}

export interface LightTransaction {
  /** do we need this field? */
  index: number;
  hash: Buffer;
  spends: LightSpend[];
  outputs: LightOutput[];
}

export interface LightSpend {
  nf: Buffer;
}

export interface LightOutput {
  /** NoteEncrypted, serialized */
  note: Buffer;
}

export interface Transaction {
  /** built, encrypted transaction */
  data: Buffer;
}

export interface SendResponse {
  hash: Buffer;
  accepted: boolean;
}

export interface ServerInfo {
  version: string;
  vendor: string;
  networkId: string;
  nodeVersion: string;
  nodeStatus: string;
  blockHeight: number;
  blockHash: string;
}

function createBaseEmpty(): Empty {
  return {};
}

export const Empty = {
  encode(_: Empty, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Empty {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEmpty();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(_: any): Empty {
    return {};
  },

  toJSON(_: Empty): unknown {
    const obj: any = {};
    return obj;
  },

  create<I extends Exact<DeepPartial<Empty>, I>>(base?: I): Empty {
    return Empty.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Empty>, I>>(_: I): Empty {
    const message = createBaseEmpty();
    return message;
  },
};

function createBaseBlockID(): BlockID {
  return { sequence: undefined, hash: undefined };
}

export const BlockID = {
  encode(message: BlockID, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sequence !== undefined) {
      writer.uint32(8).uint64(message.sequence);
    }
    if (message.hash !== undefined) {
      writer.uint32(18).bytes(message.hash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockID {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockID();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.sequence = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.hash = reader.bytes() as Buffer;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlockID {
    return {
      sequence: isSet(object.sequence) ? Number(object.sequence) : undefined,
      hash: isSet(object.hash) ? Buffer.from(bytesFromBase64(object.hash)) : undefined,
    };
  },

  toJSON(message: BlockID): unknown {
    const obj: any = {};
    if (message.sequence !== undefined) {
      obj.sequence = Math.round(message.sequence);
    }
    if (message.hash !== undefined) {
      obj.hash = base64FromBytes(message.hash);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockID>, I>>(base?: I): BlockID {
    return BlockID.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockID>, I>>(object: I): BlockID {
    const message = createBaseBlockID();
    message.sequence = object.sequence ?? undefined;
    message.hash = object.hash ?? undefined;
    return message;
  },
};

function createBaseBlockRange(): BlockRange {
  return { start: undefined, end: undefined };
}

export const BlockRange = {
  encode(message: BlockRange, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.start !== undefined) {
      BlockID.encode(message.start, writer.uint32(10).fork()).ldelim();
    }
    if (message.end !== undefined) {
      BlockID.encode(message.end, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BlockRange {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBlockRange();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.start = BlockID.decode(reader, reader.uint32());
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.end = BlockID.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BlockRange {
    return {
      start: isSet(object.start) ? BlockID.fromJSON(object.start) : undefined,
      end: isSet(object.end) ? BlockID.fromJSON(object.end) : undefined,
    };
  },

  toJSON(message: BlockRange): unknown {
    const obj: any = {};
    if (message.start !== undefined) {
      obj.start = BlockID.toJSON(message.start);
    }
    if (message.end !== undefined) {
      obj.end = BlockID.toJSON(message.end);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BlockRange>, I>>(base?: I): BlockRange {
    return BlockRange.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<BlockRange>, I>>(object: I): BlockRange {
    const message = createBaseBlockRange();
    message.start = (object.start !== undefined && object.start !== null)
      ? BlockID.fromPartial(object.start)
      : undefined;
    message.end = (object.end !== undefined && object.end !== null) ? BlockID.fromPartial(object.end) : undefined;
    return message;
  },
};

function createBaseLightBlock(): LightBlock {
  return {
    protoVersion: 0,
    sequence: 0,
    hash: Buffer.alloc(0),
    previousBlockHash: Buffer.alloc(0),
    timestamp: 0,
    transactions: [],
    noteSize: 0,
  };
}

export const LightBlock = {
  encode(message: LightBlock, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.protoVersion !== 0) {
      writer.uint32(8).uint32(message.protoVersion);
    }
    if (message.sequence !== 0) {
      writer.uint32(16).uint64(message.sequence);
    }
    if (message.hash.length !== 0) {
      writer.uint32(26).bytes(message.hash);
    }
    if (message.previousBlockHash.length !== 0) {
      writer.uint32(34).bytes(message.previousBlockHash);
    }
    if (message.timestamp !== 0) {
      writer.uint32(40).uint64(message.timestamp);
    }
    for (const v of message.transactions) {
      LightTransaction.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.noteSize !== 0) {
      writer.uint32(56).uint64(message.noteSize);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LightBlock {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLightBlock();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.protoVersion = reader.uint32();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.sequence = longToNumber(reader.uint64() as Long);
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.hash = reader.bytes() as Buffer;
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.previousBlockHash = reader.bytes() as Buffer;
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.timestamp = longToNumber(reader.uint64() as Long);
          continue;
        case 6:
          if (tag !== 50) {
            break;
          }

          message.transactions.push(LightTransaction.decode(reader, reader.uint32()));
          continue;
        case 7:
          if (tag !== 56) {
            break;
          }

          message.noteSize = longToNumber(reader.uint64() as Long);
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LightBlock {
    return {
      protoVersion: isSet(object.protoVersion) ? Number(object.protoVersion) : 0,
      sequence: isSet(object.sequence) ? Number(object.sequence) : 0,
      hash: isSet(object.hash) ? Buffer.from(bytesFromBase64(object.hash)) : Buffer.alloc(0),
      previousBlockHash: isSet(object.previousBlockHash)
        ? Buffer.from(bytesFromBase64(object.previousBlockHash))
        : Buffer.alloc(0),
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      transactions: Array.isArray(object?.transactions)
        ? object.transactions.map((e: any) => LightTransaction.fromJSON(e))
        : [],
      noteSize: isSet(object.noteSize) ? Number(object.noteSize) : 0,
    };
  },

  toJSON(message: LightBlock): unknown {
    const obj: any = {};
    if (message.protoVersion !== 0) {
      obj.protoVersion = Math.round(message.protoVersion);
    }
    if (message.sequence !== 0) {
      obj.sequence = Math.round(message.sequence);
    }
    if (message.hash.length !== 0) {
      obj.hash = base64FromBytes(message.hash);
    }
    if (message.previousBlockHash.length !== 0) {
      obj.previousBlockHash = base64FromBytes(message.previousBlockHash);
    }
    if (message.timestamp !== 0) {
      obj.timestamp = Math.round(message.timestamp);
    }
    if (message.transactions?.length) {
      obj.transactions = message.transactions.map((e) => LightTransaction.toJSON(e));
    }
    if (message.noteSize !== 0) {
      obj.noteSize = Math.round(message.noteSize);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<LightBlock>, I>>(base?: I): LightBlock {
    return LightBlock.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LightBlock>, I>>(object: I): LightBlock {
    const message = createBaseLightBlock();
    message.protoVersion = object.protoVersion ?? 0;
    message.sequence = object.sequence ?? 0;
    message.hash = object.hash ?? Buffer.alloc(0);
    message.previousBlockHash = object.previousBlockHash ?? Buffer.alloc(0);
    message.timestamp = object.timestamp ?? 0;
    message.transactions = object.transactions?.map((e) => LightTransaction.fromPartial(e)) || [];
    message.noteSize = object.noteSize ?? 0;
    return message;
  },
};

function createBaseLightTransaction(): LightTransaction {
  return { index: 0, hash: Buffer.alloc(0), spends: [], outputs: [] };
}

export const LightTransaction = {
  encode(message: LightTransaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.index !== 0) {
      writer.uint32(8).uint64(message.index);
    }
    if (message.hash.length !== 0) {
      writer.uint32(18).bytes(message.hash);
    }
    for (const v of message.spends) {
      LightSpend.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.outputs) {
      LightOutput.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LightTransaction {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLightTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.index = longToNumber(reader.uint64() as Long);
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.hash = reader.bytes() as Buffer;
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.spends.push(LightSpend.decode(reader, reader.uint32()));
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.outputs.push(LightOutput.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LightTransaction {
    return {
      index: isSet(object.index) ? Number(object.index) : 0,
      hash: isSet(object.hash) ? Buffer.from(bytesFromBase64(object.hash)) : Buffer.alloc(0),
      spends: Array.isArray(object?.spends) ? object.spends.map((e: any) => LightSpend.fromJSON(e)) : [],
      outputs: Array.isArray(object?.outputs) ? object.outputs.map((e: any) => LightOutput.fromJSON(e)) : [],
    };
  },

  toJSON(message: LightTransaction): unknown {
    const obj: any = {};
    if (message.index !== 0) {
      obj.index = Math.round(message.index);
    }
    if (message.hash.length !== 0) {
      obj.hash = base64FromBytes(message.hash);
    }
    if (message.spends?.length) {
      obj.spends = message.spends.map((e) => LightSpend.toJSON(e));
    }
    if (message.outputs?.length) {
      obj.outputs = message.outputs.map((e) => LightOutput.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<LightTransaction>, I>>(base?: I): LightTransaction {
    return LightTransaction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LightTransaction>, I>>(object: I): LightTransaction {
    const message = createBaseLightTransaction();
    message.index = object.index ?? 0;
    message.hash = object.hash ?? Buffer.alloc(0);
    message.spends = object.spends?.map((e) => LightSpend.fromPartial(e)) || [];
    message.outputs = object.outputs?.map((e) => LightOutput.fromPartial(e)) || [];
    return message;
  },
};

function createBaseLightSpend(): LightSpend {
  return { nf: Buffer.alloc(0) };
}

export const LightSpend = {
  encode(message: LightSpend, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.nf.length !== 0) {
      writer.uint32(18).bytes(message.nf);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LightSpend {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLightSpend();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nf = reader.bytes() as Buffer;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LightSpend {
    return { nf: isSet(object.nf) ? Buffer.from(bytesFromBase64(object.nf)) : Buffer.alloc(0) };
  },

  toJSON(message: LightSpend): unknown {
    const obj: any = {};
    if (message.nf.length !== 0) {
      obj.nf = base64FromBytes(message.nf);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<LightSpend>, I>>(base?: I): LightSpend {
    return LightSpend.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LightSpend>, I>>(object: I): LightSpend {
    const message = createBaseLightSpend();
    message.nf = object.nf ?? Buffer.alloc(0);
    return message;
  },
};

function createBaseLightOutput(): LightOutput {
  return { note: Buffer.alloc(0) };
}

export const LightOutput = {
  encode(message: LightOutput, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.note.length !== 0) {
      writer.uint32(10).bytes(message.note);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LightOutput {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLightOutput();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.note = reader.bytes() as Buffer;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): LightOutput {
    return { note: isSet(object.note) ? Buffer.from(bytesFromBase64(object.note)) : Buffer.alloc(0) };
  },

  toJSON(message: LightOutput): unknown {
    const obj: any = {};
    if (message.note.length !== 0) {
      obj.note = base64FromBytes(message.note);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<LightOutput>, I>>(base?: I): LightOutput {
    return LightOutput.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<LightOutput>, I>>(object: I): LightOutput {
    const message = createBaseLightOutput();
    message.note = object.note ?? Buffer.alloc(0);
    return message;
  },
};

function createBaseTransaction(): Transaction {
  return { data: Buffer.alloc(0) };
}

export const Transaction = {
  encode(message: Transaction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.data.length !== 0) {
      writer.uint32(10).bytes(message.data);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Transaction {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTransaction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.data = reader.bytes() as Buffer;
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): Transaction {
    return { data: isSet(object.data) ? Buffer.from(bytesFromBase64(object.data)) : Buffer.alloc(0) };
  },

  toJSON(message: Transaction): unknown {
    const obj: any = {};
    if (message.data.length !== 0) {
      obj.data = base64FromBytes(message.data);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<Transaction>, I>>(base?: I): Transaction {
    return Transaction.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<Transaction>, I>>(object: I): Transaction {
    const message = createBaseTransaction();
    message.data = object.data ?? Buffer.alloc(0);
    return message;
  },
};

function createBaseSendResponse(): SendResponse {
  return { hash: Buffer.alloc(0), accepted: false };
}

export const SendResponse = {
  encode(message: SendResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hash.length !== 0) {
      writer.uint32(10).bytes(message.hash);
    }
    if (message.accepted === true) {
      writer.uint32(16).bool(message.accepted);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SendResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSendResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.hash = reader.bytes() as Buffer;
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.accepted = reader.bool();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): SendResponse {
    return {
      hash: isSet(object.hash) ? Buffer.from(bytesFromBase64(object.hash)) : Buffer.alloc(0),
      accepted: isSet(object.accepted) ? Boolean(object.accepted) : false,
    };
  },

  toJSON(message: SendResponse): unknown {
    const obj: any = {};
    if (message.hash.length !== 0) {
      obj.hash = base64FromBytes(message.hash);
    }
    if (message.accepted === true) {
      obj.accepted = message.accepted;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<SendResponse>, I>>(base?: I): SendResponse {
    return SendResponse.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<SendResponse>, I>>(object: I): SendResponse {
    const message = createBaseSendResponse();
    message.hash = object.hash ?? Buffer.alloc(0);
    message.accepted = object.accepted ?? false;
    return message;
  },
};

function createBaseServerInfo(): ServerInfo {
  return { version: "", vendor: "", networkId: "", nodeVersion: "", nodeStatus: "", blockHeight: 0, blockHash: "" };
}

export const ServerInfo = {
  encode(message: ServerInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.version !== "") {
      writer.uint32(10).string(message.version);
    }
    if (message.vendor !== "") {
      writer.uint32(18).string(message.vendor);
    }
    if (message.networkId !== "") {
      writer.uint32(26).string(message.networkId);
    }
    if (message.nodeVersion !== "") {
      writer.uint32(34).string(message.nodeVersion);
    }
    if (message.nodeStatus !== "") {
      writer.uint32(42).string(message.nodeStatus);
    }
    if (message.blockHeight !== 0) {
      writer.uint32(48).uint64(message.blockHeight);
    }
    if (message.blockHash !== "") {
      writer.uint32(58).string(message.blockHash);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ServerInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseServerInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.version = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.vendor = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.networkId = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.nodeVersion = reader.string();
          continue;
        case 5:
          if (tag !== 42) {
            break;
          }

          message.nodeStatus = reader.string();
          continue;
        case 6:
          if (tag !== 48) {
            break;
          }

          message.blockHeight = longToNumber(reader.uint64() as Long);
          continue;
        case 7:
          if (tag !== 58) {
            break;
          }

          message.blockHash = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ServerInfo {
    return {
      version: isSet(object.version) ? String(object.version) : "",
      vendor: isSet(object.vendor) ? String(object.vendor) : "",
      networkId: isSet(object.networkId) ? String(object.networkId) : "",
      nodeVersion: isSet(object.nodeVersion) ? String(object.nodeVersion) : "",
      nodeStatus: isSet(object.nodeStatus) ? String(object.nodeStatus) : "",
      blockHeight: isSet(object.blockHeight) ? Number(object.blockHeight) : 0,
      blockHash: isSet(object.blockHash) ? String(object.blockHash) : "",
    };
  },

  toJSON(message: ServerInfo): unknown {
    const obj: any = {};
    if (message.version !== "") {
      obj.version = message.version;
    }
    if (message.vendor !== "") {
      obj.vendor = message.vendor;
    }
    if (message.networkId !== "") {
      obj.networkId = message.networkId;
    }
    if (message.nodeVersion !== "") {
      obj.nodeVersion = message.nodeVersion;
    }
    if (message.nodeStatus !== "") {
      obj.nodeStatus = message.nodeStatus;
    }
    if (message.blockHeight !== 0) {
      obj.blockHeight = Math.round(message.blockHeight);
    }
    if (message.blockHash !== "") {
      obj.blockHash = message.blockHash;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ServerInfo>, I>>(base?: I): ServerInfo {
    return ServerInfo.fromPartial(base ?? {});
  },

  fromPartial<I extends Exact<DeepPartial<ServerInfo>, I>>(object: I): ServerInfo {
    const message = createBaseServerInfo();
    message.version = object.version ?? "";
    message.vendor = object.vendor ?? "";
    message.networkId = object.networkId ?? "";
    message.nodeVersion = object.nodeVersion ?? "";
    message.nodeStatus = object.nodeStatus ?? "";
    message.blockHeight = object.blockHeight ?? 0;
    message.blockHash = object.blockHash ?? "";
    return message;
  },
};

export interface DataLoaderOptions {
  cache?: boolean;
}

export interface DataLoaders {
  rpcDataLoaderOptions?: DataLoaderOptions;
  getDataLoader<T>(identifier: string, constructorFn: () => T): T;
}

declare const self: any | undefined;
declare const window: any | undefined;
declare const global: any | undefined;
const tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw "Unable to locate global object";
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

type DeepPartial<T> = T extends Builtin ? T
  : T extends Array<infer U> ? Array<DeepPartial<U>> : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new tsProtoGlobalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
