import { request } from '@stacks/connect'
import type { TransactionResult } from '@stacks/connect/dist/types/methods'
import { Cl, Pc } from '@stacks/transactions'
import { useState } from 'react'

export default function App() {
  // ...
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

  return (
    <>
      // ...
      <span className='input-container'>
        <button onClick={addMessage}>add-message</button>
        <input type="text" onChange={e => setContent(e.target.value)}/>
      </span>
    </>
  )
}