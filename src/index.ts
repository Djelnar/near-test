import * as nearAPI from 'near-api-js'

const {keyStores, connect, WalletConnection, Near} = nearAPI

const APP_KEY_PREFIX = 'cat'
const CONTRACT_ID = 'app_2.spin_swap.testnet'

async function start() {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore()

  const config = {
    networkId: 'testnet',
    keyStore,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    headers: {},
  }

  const near = await connect(config)

  const wallet = new WalletConnection(near, APP_KEY_PREFIX)

  if (!wallet.isSignedIn()) {
    return wallet.requestSignIn({
      contractId: CONTRACT_ID,
      methodNames: ['markets'],
    })
  }
  console.log(wallet)
}

start()
