import { connect, disconnect, request } from '@stacks/connect'
import type { GetAddressesResult, TransactionResult, ClarityValue } from '@stacks/connect/dist/types/methods'
import { useState } from 'react'
import { Cl, Pc, fetchCallReadOnlyFunction } from '@stacks/transactions'

export default function App() {
  let [isConnected, setIsConnected] = useState<boolean>(false)
  let [walletInfo, setWalletInfo] = useState<any>(null)
  let [bns, setBns] = useState<string>('')

  async function connectWallet() {
    let connectionResponse: GetAddressesResult = await connect()
    let bnsName = await getBns(connectionResponse.addresses[2].address)

    setIsConnected(true)
    setWalletInfo(connectionResponse)
    setBns(bnsName)
  }

  async function disconnectWallet() {
    disconnect();
  }

  let [content, setContent] = useState<string>('')

  async function addMessage() {
    let postCond_1 = Pc.principal('ST11V9ZN6E6VG72SHMAVM9GDE30VD3VGW5Q1W9WX3')
      .willSendEq(1)
      .ft('ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token', 'sbtc-token')
  
    let result: TransactionResult = await request('stx_callContract', {
      contract: 'ST11V9ZN6E6VG72SHMAVM9GDE30VD3VGW5Q1W9WX3.stacks-dev-quickstart-message-board',
      functionName: 'add-message',
      functionArgs: [Cl.stringUtf8(content)],
      network: 'testnet',
      postConditions: [postCond_1],
      postConditionMode: 'deny',
      sponsored: false
    })
  
    setContent('')
  }
  
  async function getBns(stxAddress: string) {
    let response = await fetch(`https://api.bnsv2.com/testnet/names/address/${stxAddress}/valid`)
    let data = await response.json()

    return data.names[0].full_name
  }

  async function getMessageCountAtBlock() {
    let response = await fetch('https://api.testnet.hiro.so/v2/info', {
      headers: {
        "x-api-key": "<HIRO_API_KEY>"
      }
    })
    let data = await response.json()
    let stacksBlockHeight = data.stacks_tip_height

    let result: ClarityValue = await fetchCallReadOnlyFunction({
      contractAddress: 'ST11V9ZN6E6VG72SHMAVM9GDE30VD3VGW5Q1W9WX3',
      contractName: 'stacks-dev-quickstart-message-board',
      functionName: 'get-message-count-at-block',
      functionArgs: [Cl.uint(stacksBlockHeight)],
      network: 'testnet',
      senderAddress: 'ST11V9ZN6E6VG72SHMAVM9GDE30VD3VGW5Q1W9WX3',
    })
  }
  
  return (
    <>
      <h3>Stacks Dev Quickstart Message Board</h3>
      {isConnected ? (
        <button onClick={disconnectWallet}>{
          bns ? bns : walletInfo.addresses[2].address
        }</button>
      ) : (
        <button onClick={connectWallet}>connect wallet</button>
      )}
        <span className='input-container'>
        <button onClick={addMessage}>add-message</button>
        <input type="text" onChange={e => setContent(e.target.value)}/>
      </span>
    </>
  )
}