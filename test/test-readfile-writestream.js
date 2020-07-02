/* eslint-env mocha */

const chai = require('chai')
chai.use(require('chai-as-promised'))
const { assert } = chai
const fs = require('fs')
const unlink = require('util').promisify(require('fs').unlink)
const { writeStream, readFileComplete } = require('../')
const { makeData, verifyBlocks, verifyHas, verifyRoots } = require('./fixture-data')

let rawBlocks
let pbBlocks
let cborBlocks

describe('Read File & Write Stream', () => {
  before(async () => {
    const data = await makeData()
    rawBlocks = data.rawBlocks
    pbBlocks = data.pbBlocks
    cborBlocks = data.cborBlocks

    await unlink('./test.car').catch(() => {})
  })

  it('writeStream', async () => {
    const carDs = await writeStream(fs.createWriteStream('./test.car'))
    await carDs.setRoots([await cborBlocks[0].cid(), await cborBlocks[1].cid()])
    for (const block of rawBlocks.slice(0, 3).concat(pbBlocks).concat(cborBlocks)) {
      // add all but raw zzzz
      await carDs.put(await block.cid(), block.encode())
    }
    await carDs.close()
  })

  it('readFileComplete', async () => {
    const carDs = await readFileComplete('./test.car')
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await carDs.close()
  })

  it('writeStream no await', async () => {
    const roots = [await cborBlocks[0].cid(), await cborBlocks[1].cid()]
    const blocks = []
    for (const block of rawBlocks.slice(0, 3).concat(pbBlocks).concat(cborBlocks)) {
      blocks.push([await block.cid(), block.encode()])
    }

    const carDs = await writeStream(fs.createWriteStream('./test.car'))
    carDs.setRoots(roots)
    for (const [cid, encoded] of blocks) {
      carDs.put(cid, encoded)
    }
    await carDs.close()
  })

  it('readFileComplete post no-await write', async () => {
    const carDs = await readFileComplete('./test.car')
    await verifyHas(carDs)
    await verifyBlocks(carDs)
    await verifyRoots(carDs)
    await carDs.close()
  })

  it('writeStream errors', async () => {
    const carDs = await writeStream(fs.createWriteStream('./test.car'))
    await carDs.put(await cborBlocks[0].cid(), await cborBlocks[0].encode())
    await assert.isRejected(carDs.delete(await cborBlocks[0].cid()))
    await carDs.close()
    await assert.isRejected(carDs.close())
  })

  after(async () => {
    return unlink('./test.car').catch(() => {})
  })
})
