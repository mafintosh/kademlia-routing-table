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

function id () {
  return randomBytes(32)
}
