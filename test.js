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
