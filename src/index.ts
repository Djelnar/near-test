import * as nearAPI from 'near-api-js'
import './index.css'

const {keyStores, connect, WalletConnection, Contract, utils} = nearAPI

const APP_KEY_PREFIX = 'cat'
const CONTRACT_ID = 'app_2.spin_swap.testnet'

const appNode = document.getElementById('app')

type Market = {
  id: number
  base: {
    ticker: string
  }
  quote: {
    ticker: string
  }
}

type Order = {
  price: number
  quantity: number
}

type ContractMethods = {
  view_market: (props: {market_id: number}) => Promise<{ask_orders: Order[]; bid_orders: Order[]}>
  markets: (props: {}) => Promise<Market[]>
}

const formatNumber = (value: number, fracDigits = 4) =>
  utils.format.formatNearAmount(value.toLocaleString('fullwide', {useGrouping: false}), fracDigits)
const normalizeNumber = (value: number) => {
  return +utils.format.formatNearAmount(value.toLocaleString('fullwide', {useGrouping: false})).replace(/\,/g, '')
}

async function renderOrderBook(marketId: string, contract: ContractMethods, currentMarket: Market) {
  const marketsSelect = document.querySelector<HTMLSelectElement>('select[name=markets]')
  marketsSelect!.disabled = true

  const orderBookNode = document.querySelector('.orderBook')

  const res = await contract.view_market({
    market_id: +marketId,
  })

  const AL = res.ask_orders[0].price
  const BH = res.bid_orders[0].price

  const spread = AL - BH
  const spreadPercentage = (spread / AL) * 100

  const askOrdersReversed = res.ask_orders.slice().reverse()
  const table = `
    <table>
      <thead>
        <th class="leftColumn">Price (${currentMarket.quote.ticker})</th>
        <th class="rightColumn">Size (${currentMarket.base.ticker})</th>
        <th class="rightColumn">Total</th>
      </thead>
      ${askOrdersReversed
        .map(
          (order) => `<tr>
            <td class="leftColumn askOrder">${formatNumber(order.price)}</td>
            <td class="rightColumn">${formatNumber(order.quantity)}</td>
            <td class="rightColumn">${(normalizeNumber(order.price) * normalizeNumber(order.quantity)).toLocaleString(
              'en-US',
              {
                maximumFractionDigits: 2,
              },
            )}</td>
          </tr>`,
        )
        .join('')}
      <thead>
        <th class="leftColumn">${formatNumber(spread)}</th>
        <th class="rightColumn">Spread</th>
        <th class="rightColumn">${spreadPercentage}%</th>
      </thead>
      ${res.bid_orders
        .map(
          (order) => `<tr>
            <td class="leftColumn bidOrder">${formatNumber(order.price)}</td>
            <td class="rightColumn">${formatNumber(order.quantity)}</td>
            <td class="rightColumn">${(normalizeNumber(order.price) * normalizeNumber(order.quantity)).toLocaleString(
              'en-US',
              {
                maximumFractionDigits: 2,
              },
            )}</td>
          </tr>`,
        )
        .join('')}
    </table>
  `

  orderBookNode!.innerHTML = table
  marketsSelect!.disabled = false
}

async function renderWallet(wallet: nearAPI.WalletConnection) {
  const walletAccountId = wallet.getAccountId()
  const walletAccountIdNode = document.createElement('h1')
  walletAccountIdNode.innerHTML = walletAccountId
  appNode?.appendChild(walletAccountIdNode)

  const walletAccountBalanceObj = await wallet.account().getAccountBalance()
  const walletAccountBalanceNode = document.createElement('h1')
  const balanceFormatted = utils.format.formatNearAmount(walletAccountBalanceObj.available, 0)

  walletAccountBalanceNode.innerHTML = `${balanceFormatted} NEAR`

  appNode?.appendChild(walletAccountBalanceNode)

  const account = wallet.account()

  const contract = new Contract(account, CONTRACT_ID, {
    viewMethods: ['markets', 'view_market'],
    changeMethods: [],
  }) as any as ContractMethods

  const markets: Market[] = await contract.markets({})

  const selectRoot = document.createElement('select')
  selectRoot.name = 'markets'
  markets.map((m) => {
    const option = document.createElement('option')
    option.value = `${m.id}`
    option.innerHTML = `${m.base.ticker} / ${m.quote.ticker}`
    selectRoot.appendChild(option)
  })

  appNode?.appendChild(selectRoot)

  const orderBookNode = document.createElement('div')
  orderBookNode.className = 'orderBook'
  appNode?.appendChild(orderBookNode)

  renderOrderBook(selectRoot.value, contract, markets.find((m) => m.id === +selectRoot.value)!)

  selectRoot.addEventListener('change', () => {
    renderOrderBook(selectRoot.value, contract, markets.find((m) => m.id === +selectRoot.value)!)
  })
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
