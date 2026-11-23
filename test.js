const test = require('brittle')
const { randomBytes } = require('crypto')
const RoutingTable = require('./')

test('basic', function (t) {
  const table = new RoutingTable(id())
  const node = { id: id() }

  t.ok(table.add(node))
  t.alike(table.closest(id()), [node])
})

test('random', function (t) {
  const table = new RoutingTable(id())

  for (let i = 0; i < 1000; i++) {
    table.add({ id: id() })
  }

  t.is(table.size, table.toArray().length)

  for (let i = 0; i < 1000; i++) {
    if (!table.random()) {
      t.fail('should always be a node in there')
      break
    }
  }
})

test('insert very shared', function (t) {
  const table = new RoutingTable(Buffer.alloc(32))

  const a = Buffer.alloc(32)
  const b = Buffer.alloc(32)

  a[31] = 0b10
  b[31] = 0b11

  table.add({ id: a })
  table.add({ id: b })

  t.is(table.size, 2)
})

function id () {
  return randomBytes(32)
}

// a random id that shares exactly `bits` leading bits with `other`
function idsharing (other, bits) {
  const result = id()

  for (let i = 0; i <= bits; i++) {
    const j = i >> 3
    const mask = 128 >> (i & 7)
    const bit = (i < bits ? other[j] : ~other[j]) & mask
    result[j] = (result[j] & ~mask) | bit
  }

  return result
}

function bydistance (nodes, target) {
  return nodes.slice().sort(function (a, b) {
    for (let i = 0; i < target.length; i++) {
      const ai = a.id[i] ^ target[i]
      const bi = b.id[i] ^ target[i]
      if (ai !== bi) return ai - bi
    }
    return 0
  })
}

function samenodes (a, b) {
  return a.length === b.length && a.every((node, i) => node === b[i])
}

test('closest returns the k nodes nearest by xor distance', function (t) {
  const table = new RoutingTable(id())
  for (let i = 0; i < 1000; i++) table.add({ id: id() })

  const all = table.toArray()

  for (let i = 0; i < 200; i++) {
    // half random targets, half sharing a long prefix with table.id, where rows are sparse
    const target = i & 1 ? id() : idsharing(table.id, 4 + (i % 12))

    for (const k of [1, 20, 50]) {
      const expected = bydistance(all, target).slice(0, k)
      const actual = bydistance(table.closest(target, k), target)

      if (!samenodes(actual, expected)) {
        t.fail('closest(' + target.toString('hex') + ', ' + k + ') did not return the nearest nodes')
        return
      }
    }
  }

  t.pass('closest matched a brute force sort for every target')
})
