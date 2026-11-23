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

test('remove event emits the removed node', function (t) {
  const table = new RoutingTable(Buffer.alloc(32))

  // the first bit differs from table.id, so all three land in row 0
  const [a, b, c] = [1, 2, 3].map(function (n) {
    const id = Buffer.alloc(32)
    id[0] = 0x80
    id[31] = n
    return { id }
  })

  table.add(a)
  table.add(b)
  table.add(c)

  const removed = []
  table.rows[0].on('remove', (node) => removed.push(node))

  table.remove(b.id) // middle of the row
  t.is(removed.pop(), b)
  t.alike(table.rows[0].nodes, [a, c])

  table.remove(a.id) // start of the row
  t.is(removed.pop(), a)

  table.remove(c.id) // only node left
  t.is(removed.pop(), c)
  t.is(table.rows[0].nodes.length, 0)
})

function id () {
  return randomBytes(32)
}
