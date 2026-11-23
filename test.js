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

test('size counts nodes added and removed through a row', function (t) {
  const table = new RoutingTable(Buffer.alloc(32), { k: 2 })

  // the first bit differs from table.id, so all three land in row 0
  const [a, b, c] = [1, 2, 3].map(function (n) {
    const id = Buffer.alloc(32)
    id[0] = 0x80
    id[31] = n
    return { id }
  })

  table.add(a)
  table.add(b)
  table.add({ id: b.id }) // replaces b, so no new node
  t.is(table.size, 2)

  const row = table.rows[0]

  // swap a node in the full handler, as the README suggests
  row.once('full', function (node) {
    row.remove(a.id)
    row.add(node)
  })
  table.add(c)
  t.is(table.size, 2)

  // remove through the row without adding anything back
  row.remove(b.id)
  t.is(table.size, 1)
  t.is(table.size, table.toArray().length)

  for (let i = 0; i < 100; i++) {
    if (!table.random()) {
      t.fail('random() returned null on a non-empty table')
      return
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
