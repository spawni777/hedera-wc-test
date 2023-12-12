import {
  Client,
  AccountBalanceQuery,
  AccountInfoQuery,
  AccountRecordsQuery,
  TransactionReceiptQuery,
  type AccountId,
  type Executable,
  type Provider as HederaWalletProvider,
  type TransactionId,
  type TransactionResponse,
  type TransactionReceipt,
} from '@hashgraph/sdk'

/**
 * A class representing a provider for interacting with Hedera Hashgraph wallet functionalities.
 */
export default class Provider implements HederaWalletProvider {
  /**
   * Creates a new Provider instance.
   * @param client - The Hashgraph SDK Client instance to interact with the network.
   */
  constructor(private client: Client) {}

  /**
   * Creates a Provider instance from an existing Hashgraph SDK Client.
   * @param client - The Hashgraph SDK Client instance to use.
   * @returns A new Provider instance.
   */
  static fromClient(client: Client) {
    return new Provider(client)
  }

  /**
   * Gets the ledger ID associated with the client.
   * @returns The ledger ID.
   */
  getLedgerId() {
    return this.client.ledgerId
  }

  /**
   * Gets the network associated with the client.
   * @returns The network information.
   */
  getNetwork() {
    return this.client.network
  }

  /**
   * Gets the mirror network associated with the client.
   * @returns The mirror network information.
   */
  getMirrorNetwork() {
    return this.client.mirrorNetwork
  }

  /**
   * Retrieves the account balance for a given account ID.
   * @param accountId - The account ID for which to retrieve the balance.
   * @returns Promise\<AccountBalance\>
   */
  getAccountBalance(accountId: AccountId | string) {
    return new AccountBalanceQuery().setAccountId(accountId).execute(this.client)
  }

  /**
   * Retrieves the account information for a given account ID.
   * @param accountId - The account ID for which to retrieve the information.
   * @returns Promise\<AccountInfo\>
   */
  getAccountInfo(accountId: AccountId | string) {
    return new AccountInfoQuery().setAccountId(accountId).execute(this.client)
  }

  /**
   * Retrieves the account records for a given account ID.
   * @param accountId - The account ID for which to retrieve the records.
   * @returns Promise<TransactionRecord[]>
   */
  getAccountRecords(accountId: string | AccountId) {
    return new AccountRecordsQuery().setAccountId(accountId).execute(this.client)
  }

  /**
   * Retrieves the transaction receipt for a given transaction ID.
   * @param transactionId - The transaction ID for which to retrieve the receipt.
   * @returns Promise<TransactionReceipt>
   */
  getTransactionReceipt(transactionId: TransactionId | string) {
    return new TransactionReceiptQuery().setTransactionId(transactionId).execute(this.client)
  }

  /**
   * Waits for the transaction receipt based on the provided TransactionResponse.
   * @param response - The TransactionResponse object containing transaction details.
   * @returns Promise<TransactionReceipt>
   */
  waitForReceipt(response: TransactionResponse): Promise<TransactionReceipt> {
    return new TransactionReceiptQuery()
      .setNodeAccountIds([response.nodeId])
      .setTransactionId(response.transactionId)
      .execute(this.client)
  }

  /**
   * Executes a request using the client.
   * @typeparam Request - The type of request being made.
   * @typeparam Response - The type of response expected.
   * @typeparam Output - The output type of the execution.
   * @param request - The executable request to be executed.
   * @returns Promise<Output> - promise resolving to the output of the request execution.
   */
  call<Request, Response, Output>(
    request: Executable<Request, Response, Output>,
  ): Promise<Output> {
    return request.execute(this.client)
  }
}
