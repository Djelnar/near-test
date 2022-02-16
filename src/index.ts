import * as nearAPI from 'near-api-js'
import './index.css'

const {keyStores, connect, WalletConnection, utils} = nearAPI

const APP_KEY_PREFIX = 'cat'
const CONTRACT_ID = 'app_2.spin_swap.testnet'

const appNode = document.getElementById('app')

async function renderWallet(wallet: nearAPI.WalletConnection) {
  const walletAccountId = wallet.getAccountId()
  const walletAccountIdNode = document.createElement('h1')
  walletAccountIdNode.innerHTML = walletAccountId
  appNode?.appendChild(walletAccountIdNode)

  const walletAccountBalanceObj = await wallet.account().getAccountBalance()
  const walletAccountBalanceNode = document.createElement('h1')
  walletAccountBalanceNode.innerHTML = utils.format.formatNearAmount(walletAccountBalanceObj.available, 0)
  appNode?.appendChild(walletAccountBalanceNode)
}

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
    const loginButton = document.createElement('button')
    loginButton.innerHTML = 'Login'
    loginButton.className = 'actionButton'
    loginButton.addEventListener('click', () => {
      wallet.requestSignIn({
        contractId: CONTRACT_ID,
        methodNames: ['markets'],
      })
    })

    appNode?.appendChild(loginButton)
  } else {
    const logoutButton = document.createElement('button')
    logoutButton.innerHTML = 'Logout'
    logoutButton.className = 'actionButton'
    logoutButton.addEventListener('click', () => {
      wallet.signOut()
      window.location.reload()
    })

    appNode?.appendChild(logoutButton)

    renderWallet(wallet)
  }
}

start()
