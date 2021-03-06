/* eslint-env mocha */

const assert = require('assert')
const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
fs.readFile = promisify(fs.readFile)
const { verifyDecoded } = require('./fixture-data')
const coding = require('../lib/coding')

describe('Decode', () => {
  it('decodeFile', async () => {
    const decoded = await coding.decodeFile(path.join(__dirname, 'go.car'))
    return verifyDecoded(decoded)
  })

  it('decodeFile small buffer', async () => {
    const decoded = await coding.decodeFile(path.join(__dirname, 'go.car'), { bufferSize: 8 })
    return verifyDecoded(decoded)
  })

  it('decodeBuffer', async () => {
    const decoded = await coding.decodeBuffer(await fs.readFile(path.join(__dirname, 'go.car')))
    return verifyDecoded(decoded)
  })

  it('decodeStream', async () => {
    const decoded = await coding.decodeStream(fs.createReadStream(path.join(__dirname, 'go.car')))
    return verifyDecoded(decoded)
  })

  it('decode errors', async () => {
    const buf = await fs.readFile(path.join(__dirname, 'go.car'))
    // truncated
    await assert.rejects(coding.decodeBuffer(buf.slice(0, buf.length - 10)), {
      name: 'Error',
      message: 'Unexpected end of Buffer'
    })

    // cid v0
    const buf2 = Buffer.alloc(buf.length)
    buf.copy(buf2)
    buf2[101] = 0 // first block's CID
    await assert.rejects(coding.decodeBuffer(buf2), {
      name: 'Error',
      message: 'Unexpected CID version (0)'
    })
  })
})
