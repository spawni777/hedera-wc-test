import { type Transaction } from '@hashgraph/sdk'
import { EngineTypes } from '@walletconnect/types'
import { HederaJsonRpcMethod, transactionToBase64String } from '../shared'

/**
 * Builds parameters for signing messages.
 *
 * account ID - Hedera Account identifier in {@link https://hips.hedera.com/hip/hip-30 | HIP-30} (`<nework>:<shard>.<realm>.<num>`) form.
 * @param signerAccountId - The signer's account ID.
 * @param messages - An array of messages to be signed, each can be a Uint8Array or a string.
 * @returns An object containing signer's account ID and base64 encoded messages.
 *
 */
export function buildSignMessageParams(
  signerAccountId: string,
  messages: (Uint8Array | string)[],
) {
  return {
    signerAccountId,
    messages: messages.map((message) => Buffer.from(message).toString('base64')),
  }
}

function _buildTransactionParams(signerAccountId: string, transaction: Transaction) {
  return {
    signerAccountId,
    transaction: {
      bytes: transactionToBase64String(transaction),
    },
  }
}

/**
 * Builds parameters for signing and executing a transaction.
 *
 * @param signerAccountId - The signer's account ID.
 * @param transaction - The transaction object to be signed and executed.
 * @returns An object containing the signer's account ID and base64 encoded transaction.
 */
export function buildSignAndExecuteTransactionParams(
  signerAccountId: string,
  transaction: Transaction,
) {
  return _buildTransactionParams(signerAccountId, transaction)
}

/**
 * Builds parameters for signing and returning a transaction.
 *
 * @param signerAccountId - The signer's account ID.
 * @param transaction - The transaction object to be signed.
 * @returns An object containing the signer's account ID and base64 encoded transaction.
 */
export function buildSignAndReturnTransactionParams(
  signerAccountId: string,
  transaction: Transaction,
) {
  return _buildTransactionParams(signerAccountId, transaction)
}

/**
 * Options used to build a Hedera session request.
 */
export type HederaSessionRequestOptions = Pick<
  EngineTypes.RequestParams,
  'chainId' | 'topic' | 'expiry'
>

/**
 * Represents a request builder for Hedera sessions.
 */
export class HederaSessionRequest {
  public chainId: HederaSessionRequestOptions['chainId']
  public topic: HederaSessionRequestOptions['topic']
  public expiry: HederaSessionRequestOptions['expiry']

  /**
   * Constructs a new HederaSessionRequest.
   * @param {HederaSessionRequestOptions} options - The options for the session request.
   */
  constructor({ chainId, topic, expiry }: HederaSessionRequestOptions) {
    this.chainId = chainId
    this.topic = topic
    this.expiry = expiry
  }

  /**
   * Creates a new instance of `HederaSessionRequest`.
   *
   * @param {HederaSessionRequestOptions} options - Options to initialize the session request.
   * @returns A new `HederaSessionRequest` object.
   */
  public static create(options: HederaSessionRequestOptions) {
    return new HederaSessionRequest(options)
  }

  /**
   * Builds a request to sign and execute a transaction.
   *
   * @param signerAccountId - The signer's account ID.
   * @param transaction - The transaction object to be signed and executed.
   * @returns An object representing the request to sign and execute the transaction.
   */
  public buildSignAndExecuteTransactionRequest(
    signerAccountId: string,
    transaction: Transaction,
  ) {
    return {
      chainId: this.chainId,
      topic: this.topic,
      expiry: this.expiry,
      request: {
        method: HederaJsonRpcMethod.SignAndExecuteTransaction,
        params: buildSignAndExecuteTransactionParams(signerAccountId, transaction),
      },
    }
  }

  /**
   * Builds a request to sign and return a transaction.
   *
   * @param signerAccountId - The signer's account ID.
   * @param transaction - The transaction object to be signed.
   * @returns An object representing the request to sign and return the transaction.
   */
  public buildSignAndReturnTransactionRequest(
    signerAccountId: string,
    transaction: Transaction,
  ) {
    return {
      chainId: this.chainId,
      topic: this.topic,
      expiry: this.expiry,
      request: {
        method: HederaJsonRpcMethod.SignTransaction,
        params: buildSignAndReturnTransactionParams(signerAccountId, transaction),
      },
    }
  }

  /**
   * Builds a request to sign messages.
   *
   * @param signerAccountId - The signer's account ID.
   * @param messages - An array of messages to be signed.
   * @returns An object representing the request to sign messages.
   */
  public buildSignMessageRequest(signerAccountId: string, messages: (Uint8Array | string)[]) {
    return {
      chainId: this.chainId,
      topic: this.topic,
      expiry: this.expiry,
      request: {
        method: HederaJsonRpcMethod.SignMessage,
        params: buildSignMessageParams(signerAccountId, messages),
      },
    }
  }
}
