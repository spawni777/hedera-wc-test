// https://docs.walletconnect.com/2.0/api/sign/dapp-usage
import { SignClientTypes } from '@walletconnect/types'
import {
  TransferTransaction,
  Hbar,
  TransactionId,
  AccountInfoQuery,
  AccountId,
  Timestamp,
  LedgerId,
  AccountInfo,
} from '@hashgraph/sdk'
import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  transactionToBase64String,
  queryToBase64String,
  ExecuteTransactionParams,
  SignMessageParams,
  SignQueryAndSendParams,
  SignAndExecuteTransactionParams,
  SignTransactionParams,
} from '@hashgraph/walletconnect'

import { DAppConnector } from '@hashgraph/walletconnect'

import { saveState, loadState, getState } from '../shared'

// referenced in handlers
var dAppConnector: DAppConnector | undefined
/*
 * Simple handler to show errors or success to user
 */
async function showErrorOrSuccess<R>(method: (e: SubmitEvent) => Promise<R>, e: SubmitEvent) {
  try {
    e.preventDefault()
    saveState(e)
    const result = await method(e)
    console.log(result)
    alert(`Success: ${JSON.stringify(result)}`)
  } catch (e) {
    console.error(e)
    alert(`Error: ${JSON.stringify(e)}`)
  }
}
/*
 * WalletConnect
 *  - signClient
 *  - activeSession
 *  - init
 *  - connect
 *  - disconnect
 */
loadState() // load previous state if it exists

// Initialize WalletConnect library
async function init(e: Event) {
  const projectId = getState('project-id')
  const metadata: SignClientTypes.Metadata = {
    name: getState('name'),
    description: getState('description'),
    url: getState('url'),
    icons: [getState('icons')],
  }

  dAppConnector = new DAppConnector(
    metadata,
    LedgerId.TESTNET,
    projectId,
    Object.values(HederaJsonRpcMethod),
    [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
  )

  await dAppConnector.init({ logger: 'error' })

  const eventTarget = e.target as HTMLElement
  eventTarget
    .querySelectorAll('input,button')
    .forEach((input) => ((input as HTMLInputElement).disabled = true))
  document
    .querySelectorAll('.toggle input,.toggle button, .toggle select')
    .forEach((element) => ((element as HTMLInputElement).disabled = false))

  return 'dApp: WalletConnect initialized!'
}

document.getElementById('init')!.onsubmit = (e: SubmitEvent) => showErrorOrSuccess(init, e)

// connect a new pairing string to a wallet via the WalletConnect modal
async function connect(_: Event) {
  await dAppConnector!.connectQR()

  return 'Connected to wallet!'
}

document.getElementById('connect')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(connect, e)

// disconnect
async function disconnect(e: Event) {
  e.preventDefault()
  dAppConnector!.disconnectAll()
}

document.querySelector<HTMLFormElement>('#disconnect')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(disconnect, e)

/*
 * JSON RPC Methods
 */
// 1. hedera_getNodeAddresses
async function hedera_getNodeAddresses(_: Event) {
  return await dAppConnector!.getNodeAddresses()
}

document.getElementById('hedera_getNodeAddresses')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(hedera_getNodeAddresses, e)

// 2. hedera_executeTransaction
async function hedera_executeTransaction(_: Event) {
  const params: ExecuteTransactionParams = {
    signedTransaction: getState('send-transaction'),
  }

  return await dAppConnector!.executeTransaction(params)
}
document.getElementById('hedera_executeTransaction')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(hedera_executeTransaction, e)

// 3. hedera_signMessage
async function hedera_signMessage(_: Event) {
  const params: SignMessageParams = {
    message: getState('sign-message'),
    signerAccountId: getState('sign-from'),
  }

  return await dAppConnector!.signMessage(params)
}

document.getElementById('hedera_signMessage')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(hedera_signMessage, e)

// 4. SignQueryAndSend
async function hedera_signQueryAndSend(_: Event) {
  const query = new AccountInfoQuery().setAccountId(getState('query-payment-account'))
  const params: SignQueryAndSendParams = {
    signerAccountId: getState('query-payment-account'),
    query: queryToBase64String(query),
  }

  return await dAppConnector!.signQueryAndSend(params)
}

document.getElementById('hedera_signQueryAndSend')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(hedera_signQueryAndSend, e)

// 5. hedera_signAndExecuteTransaction
async function hedera_signAndExecuteTransaction(_: Event) {
  const transaction = new TransferTransaction()
    .setTransactionId(TransactionId.generate(getState('sign-send-from')))
    .addHbarTransfer(getState('sign-send-from'), new Hbar(-getState('sign-send-amount')))
    .addHbarTransfer(getState('sign-send-to'), new Hbar(+getState('sign-send-amount')))

  const params: SignAndExecuteTransactionParams = {
    transaction: [transactionToBase64String(transaction)],
    signerAccountId: getState('sign-send-from'),
  }

  console.log(params)

  return await dAppConnector!.signAndExecuteTransaction(params)
}
document.getElementById('hedera_signAndExecuteTransaction')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(hedera_signAndExecuteTransaction, e)

// 6. hedera_signTransaction
async function hedera_signTransaction(_: Event) {
  const transaction = new TransferTransaction()
    .setTransactionId(TransactionId.generate(getState('sign-from')))
    .addHbarTransfer(getState('sign-from'), new Hbar(-getState('sign-amount')))
    .addHbarTransfer(getState('sign-to'), new Hbar(+getState('sign-amount')))

  const params: SignTransactionParams = {
    signerAccountId: getState('sign-from'),
    transaction: [transactionToBase64String(transaction)],
  }

  return await dAppConnector!.signTransaction(params)
}
document.getElementById('hedera_signTransaction')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(hedera_signTransaction, e)

/*
 * Error handling simulation
 */
async function simulateGossipNodeError(_: Event) {
  const sender = getState('sign-send-from') || getState('send-from')
  const recepient = getState('sign-send-to') || getState('send-to')

  const transaction = new TransferTransaction()
    .setNodeAccountIds([new AccountId(999)]) // this is invalid node id
    .setTransactionId(TransactionId.generate(sender))
    .addHbarTransfer(sender, new Hbar(-5))
    .addHbarTransfer(recepient, new Hbar(+5))

  const params: SignAndExecuteTransactionParams = {
    transaction: [transactionToBase64String(transaction)],
    signerAccountId: getState('sign-send-from'),
  }

  return await dAppConnector!.signAndExecuteTransaction(params)
}

document.getElementById('error-gossip-node')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(simulateGossipNodeError, e)

async function simulateTransactionExpiredError(_: Event) {
  const sender = getState('sign-send-from') || getState('send-from')
  const recepient = getState('sign-send-to') || getState('send-to')

  const transaction = new TransferTransaction()
    // set valid start to 15 seconds ago
    .setTransactionId(
      TransactionId.withValidStart(
        AccountId.fromString(sender),
        Timestamp.fromDate(Date.now() - 15000),
      ),
    )
    // 15 seconds is a minimum valid duration otherwise there's an INVALID_TRANSACTION_DURATION error
    .setTransactionValidDuration(15)
    .addHbarTransfer(sender, new Hbar(-5))
    .addHbarTransfer(recepient, new Hbar(+5))

  const params: SignAndExecuteTransactionParams = {
    transaction: [transactionToBase64String(transaction)],
    signerAccountId: sender,
  }

  return await dAppConnector!.signAndExecuteTransaction(params)
}

document.getElementById('error-transaction-expired')!.onsubmit = (e: SubmitEvent) =>
  showErrorOrSuccess(simulateTransactionExpiredError, e)
