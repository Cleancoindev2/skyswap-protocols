import { fancy } from 'fancy-test'
import { expect } from 'chai'
import { ethers } from 'ethers'
import { bigNumberify } from 'ethers/utils'
import { ADDRESS_ZERO } from '@airswap/constants'
import { functions } from '@airswap/test-utils'
import { createOrder, signOrder } from '@airswap/utils'

import { Delegate } from '..'

class MockTransaction {
  public hash: string

  public constructor() {
    this.hash = 'trxHash'
  }

  public wait() {
    return
  }
}

class MockContract {
  public tradeWallet() {
    return 'tradeWallet'
  }

  public getMaxQuote() {
    return {
      senderAmount: 333,
      signerAmount: 999,
    }
  }

  public getSignerSideQuote() {
    return 999
  }

  public getSenderSideQuote() {
    return 333
  }

  public provideOrder() {
    return new MockTransaction()
  }

  public balanceOf() {
    return bigNumberify(1000)
  }
}

class MockContractBAD {
  public getMaxQuote() {
    return {
      senderAmount: 0,
      signerAmount: 0,
    }
  }

  public getSignerSideQuote() {
    return 0
  }

  public getSenderSideQuote() {
    return 0
  }

  public balanceOf() {
    return bigNumberify(0)
  }
}

let signer
let order

describe('Delegate', () => {
  before(async () => {
    signer = functions.getTestWallet()
    order = await signOrder(
      createOrder({
        signer: {
          wallet: '',
          token: '',
          amount: 0,
        },
        sender: {
          wallet: '',
          token: '',
          amount: 0,
        },
      }),
      signer,
      ''
    )
  })
  fancy
    .stub(ethers, 'Contract', () => new MockContract())
    .it('Delegate getWallet()', async () => {
      const wallet = await new Delegate(ADDRESS_ZERO).getWallet()
      expect(wallet).to.equal('tradeWallet')
    })
  fancy
    .stub(ethers, 'Contract', () => new MockContract())
    .it('Delegate getMaxQuote()', async () => {
      const quote = await new Delegate(ADDRESS_ZERO).getMaxQuote('', '')
      expect(quote.protocol).to.equal('0x0001')
      expect(quote.locator).to.equal(ADDRESS_ZERO)
      expect(quote.sender.amount).to.equal('333')
      expect(quote.signer.amount).to.equal('999')
    })
  fancy
    .stub(ethers, 'Contract', () => new MockContractBAD())
    .do(async () => {
      await new Delegate(ADDRESS_ZERO).getMaxQuote('', '')
    })
    .catch(/Not quoting for requested amount or token pair/)
    .it('Delegate getMaxQuote() throw')
  fancy
    .stub(ethers, 'Contract', () => new MockContract())
    .it('Delegate getSignerSideQuote()', async () => {
      const quote = await new Delegate(ADDRESS_ZERO).getSignerSideQuote(
        '333',
        '',
        ''
      )
      expect(quote.protocol).to.equal('0x0001')
      expect(quote.locator).to.equal(ADDRESS_ZERO)
      expect(quote.sender.amount).to.equal('333')
      expect(quote.signer.amount).to.equal('999')
    })
  fancy
    .stub(ethers, 'Contract', () => new MockContractBAD())
    .do(async () => {
      await new Delegate(ADDRESS_ZERO).getSignerSideQuote('', '', '')
    })
    .catch(/Not quoting for requested amount or token pair/)
    .it('Delegate getSignerSideQuote() throw')
  fancy
    .stub(ethers, 'Contract', () => new MockContract())
    .it('Delegate getSenderSideQuote()', async () => {
      const quote = await new Delegate(ADDRESS_ZERO).getSenderSideQuote(
        '999',
        '',
        ''
      )
      expect(quote.protocol).to.equal('0x0001')
      expect(quote.locator).to.equal(ADDRESS_ZERO)
      expect(quote.sender.amount).to.equal('333')
      expect(quote.signer.amount).to.equal('999')
    })
  fancy
    .stub(ethers, 'Contract', () => new MockContractBAD())
    .do(async () => {
      await new Delegate(ADDRESS_ZERO).getSenderSideQuote('', '', '')
    })
    .catch(/Not quoting for requested amount or token pair/)
    .it('Delegate getSenderSideQuote() throw')
  fancy
    .stub(ethers, 'Contract', () => new MockContract())
    .it('Delegate provideOrder()', async () => {
      const trx = await new Delegate(ADDRESS_ZERO).provideOrder(order, signer)
      expect(trx).to.equal('trxHash')
    })
  fancy
    .stub(ethers, 'Contract', () => new MockContract())
    .do(async () => {
      const trx = await new Delegate(ADDRESS_ZERO).provideOrder(order)
      expect(trx).to.equal('trxHash')
    })
    .catch(/Wallet must be provided/)
    .it('Delegate provideOrder() throw')
})
