import type Transport from "@ledgerhq/hw-transport";
import { splitPath } from "./utils";
import { publicKeyToAddress } from "iotex-antenna/lib/crypto/crypto";

const CLA = 0x55;
const CHUNK_SIZE = 250;
const INS = {
  GET_VERSION: 0x00,
  PUBLIC_KEY_SECP256K1: 0x01,
  SIGN_SECP256K1: 0x02,
  SHOW_ADDR_SECP256K1: 0x03,
  GET_ADDR_SECP256K1: 0x04,
  SIGN_PERSONAL_MESSAGE: 0x05,
};
const ERROR_DESCRIPTION = {
  1: 'U2F: Unknown',
  2: 'U2F: Bad request',
  3: 'U2F: Configuration unsupported',
  4: 'U2F: Device Ineligible',
  5: 'U2F: Timeout',
  14: 'Timeout',
  0x9000: 'No errors',
  0x9001: 'Device is busy',
  0x6400: 'Execution Error',
  0x6700: 'Wrong Length',
  0x6982: 'Empty Buffer',
  0x6983: 'Output buffer too small',
  0x6984: 'Data is invalid',
  0x6985: 'Conditions not satisfied',
  0x6986: 'Transaction rejected',
  0x6A80: 'Bad key handle',
  0x6B00: 'Invalid P1/P2',
  0x6D00: 'Instruction not supported',
  0x6E00: 'App does not seem to be open',
  0x6F00: 'Unknown error',
  0x6F01: 'Sign/verify error',
};

const errorCodeToString = (statusCode: number): string => {
  if (statusCode in ERROR_DESCRIPTION) {
    // @ts-ignore
    return ERROR_DESCRIPTION[statusCode];
  }
  return `Unknown Status Code: ${statusCode}`;
}

const processErrorResponse = (response: {statusCode: number}) => {
  return {
    code: response.statusCode,
    message: errorCodeToString(response.statusCode),
  };
}

export default class IoTeXApp {
  private transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  public async getAddress(path: string): Promise<{
    returnCode: number;
    publicKey: string;
    address: string;
    path: string;
  }> {
    return this.transport
      .send(
        CLA,
        INS.PUBLIC_KEY_SECP256K1,
        0x00,
        0x00,
        this.serializePath(path)
      )
      .then((response) => {
        const errorCodeData = response.slice(-2);
        const returnCode = errorCodeData[0] * 256 + errorCodeData[1];
        const publicKey = Buffer.from(response.slice(0, 65)).toString("hex");

        return {
          returnCode,
          publicKey: publicKey,
          address: publicKeyToAddress(publicKey),
          path: path,
        };
      });
  }

  private serializePath(path: string): Buffer {
    const paths = splitPath(path);
    const buf = Buffer.alloc(1 + 4 * paths.length);
    buf.writeUInt8(paths.length, 0);
    for (let i = 0; i < paths.length; i++) {
      buf.writeInt32LE(paths[i], 1 + i * 4);
    }
    return buf;
  }

  private signGetChunks(path: string, message: Buffer): Buffer[] {
    const chunks = [];
    chunks.push(this.serializePath(path));
    const buffer = Buffer.from(message);
  
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      let end = i + CHUNK_SIZE;
      if (i > buffer.length) {
        end = buffer.length;
      }
      chunks.push(buffer.slice(i, end));
    }
  
    return chunks;
  }

  private async signSendChunk(type: number, chunkIdx: number, chunkNum: number, chunk: Buffer): Promise<{
    signature?: Buffer;
    code: number;
    message: string;
  }> {
    // @ts-ignore
    return await this.transport.send(
      CLA,
      type,
      chunkIdx,
      chunkNum,
      chunk,
      [0x9000, 0x6A80, 0x6986],
    ).then(
        (response) => {
          const errorCodeData = response.slice(-2);
          const returnCode = errorCodeData[0] * 256 + errorCodeData[1];

          let errorMessage = errorCodeToString(returnCode);

          if (returnCode === 0x6A80) {
            errorMessage = response.slice(0, response.length - 2).toString('ascii');
          }

          let signature = null;
          if (response.length > 2) {
            signature = response.slice(0, response.length - 2);
          }

          return {
            signature,
            code: returnCode,
            message: errorMessage,
          };
        },
        processErrorResponse,
      );
  }

  public async signTransaction(path: string, transaction: Buffer): Promise<{
    signature?: Buffer;
    code: number;
    message: string;
  }> {
    const chunks = this.signGetChunks(path, transaction);
    // @ts-ignore
    return await this.signSendChunk(INS.SIGN_SECP256K1, 1, chunks.length, chunks[0])
      .then(
        async (response) => {
          let result = {
            code: response.code,
            message: response.message,
            signature: null,
          };

          for (let i = 1; i < chunks.length; i += 1) {
            // @ts-ignore
            result = await this.signSendChunk(INS.SIGN_SECP256K1, 1 + i, chunks.length, chunks[i]);
            if (result.code !== 0x9000) {
              break;
            }
          }

          return {
            code: result.code,
            message: result.message,
            signature: result.signature,
          };
        },
        processErrorResponse,
      );
  }

  public async signMessage(path: string, message: Buffer): Promise<{
    signature?: Buffer;
    code: number;
    message: string;
  }> {
    const chunks = this.signGetChunks(path, message);
    // @ts-ignore
    return await this.signSendChunk(INS.SIGN_PERSONAL_MESSAGE, 1, chunks.length, chunks[0])
      .then(
        async (response) => {
          let result = {
            code: response.code,
            message: response.message,
            signature: null,
          };

          for (let i = 1; i < chunks.length; i += 1) {
            // @ts-ignore
            result = await this.signSendChunk(INS.SIGN_PERSONAL_MESSAGE, 1 + i, chunks.length, chunks[i]);
            if (result.code !== 0x9000) {
              break;
            }
          }

          return {
            code: result.code,
            message: result.message,
            signature: result.signature,
          };
        },
        processErrorResponse,
      );
  }
}
