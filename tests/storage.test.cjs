const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { loader, fixture } = require('./helpers.cjs')
const load = loader()
const { ContestStore } = load('electron/contestStore.ts')
const { createContest } = load('src/utils/createContest.ts')
const { SaveCoordinator } = load('src/utils/saveCoordinator.ts')
const tick = () => new Promise((resolve) => setImmediate(resolve))

async function temporary(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'bouleo-test-'))
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  return directory
}

test('serialized saves, reads and deletion preserve ordering', async (t) => {
  const store = new ContestStore(await temporary(t))
  const first = createContest(fixture())
  const last = { ...first, name: 'Latest' }
  await Promise.all([store.save(first), store.save(last)])
  assert.equal((await store.load(first.id)).name, 'Latest')
  await store.flush()
  await store.delete(first.id)
  assert.equal((await store.list()).contests.length, 0)
})

test('saved dates are sorted chronologically even with different timezone offsets', async (t) => {
  const directory = await temporary(t)
  const store = new ContestStore(directory)
  const older = createContest(fixture())
  const newer = createContest(fixture())
  await fs.writeFile(
    path.join(directory, `${older.id}.json`),
    JSON.stringify({ version: 1, savedAt: '2026-10-12T14:00:00+02:00', contest: older }),
  )
  await fs.writeFile(
    path.join(directory, `${newer.id}.json`),
    JSON.stringify({ version: 1, savedAt: '2026-10-12T12:30:00Z', contest: newer }),
  )
  assert.deepEqual(
    (await store.list()).contests.map((contest) => contest.id),
    [newer.id, older.id],
  )
})

test('save, load and delete reject traversal without touching outside files', async (t) => {
  const store = new ContestStore(await temporary(t))
  const c = createContest(fixture())
  for (const id of ['../outside', '..\\outside', 'C:\\outside', '', null]) {
    await assert.rejects(store.save({ ...c, id }))
    await assert.rejects(store.load(id))
    await assert.rejects(store.delete(id))
  }
})

test('unreadable saves are reported, preserved and do not hide valid contests', async (t) => {
  const dir = await temporary(t)
  const store = new ContestStore(dir)
  await store.save(createContest(fixture()))
  await fs.writeFile(path.join(dir, 'broken.json'), '{')
  await fs.writeFile(path.join(dir, 'unsupported.json'), JSON.stringify({ version: 999 }))
  const result = await store.list()
  assert.equal(result.contests.length, 1)
  assert.equal(result.errors.length, 2)
  assert.equal(await fs.readFile(path.join(dir, 'broken.json'), 'utf8'), '{')
})

test('write failures are propagated and a retry can succeed', async (t) => {
  const dir = await temporary(t)
  const blocked = path.join(dir, 'blocked')
  await fs.writeFile(blocked, 'not a directory')
  const store = new ContestStore(blocked)
  const c = createContest(fixture())
  await assert.rejects(store.save(c))
  await fs.unlink(blocked)
  await store.save(c)
  assert.equal((await store.load(c.id)).id, c.id)
})

test('listing uses the saved timestamp rather than file modification time', async (t) => {
  const directory = await temporary(t)
  const store = new ContestStore(directory)
  const contest = createContest(fixture())
  const file = path.join(directory, `${contest.id}.json`)
  const savedAt = '2020-01-01T00:00:00.000Z'
  await fs.writeFile(file, JSON.stringify({ version: 1, savedAt, contest }))
  await fs.utimes(file, new Date(), new Date())
  assert.equal((await store.list()).contests[0].savedAt, savedAt)
  assert.deepEqual(await store.load(contest.id), contest)
})

test('close flush waits for writes and retains failed snapshots across navigation', async () => {
  let resolveWrite
  let failing = false
  const written = []
  const saver = new SaveCoordinator(async (c) => {
    written.push(c.name)
    if (failing) throw new Error('disk full')
    await new Promise((resolve) => {
      resolveWrite = resolve
    })
  })
  const c = createContest(fixture())
  saver.save(c)
  await tick()
  let closed = false
  const closing = saver.flush().then(() => {
    closed = true
  })
  await tick()
  assert.equal(closed, false)
  resolveWrite()
  await closing
  assert.equal(closed, true)
  failing = true
  saver.save({ ...c, name: 'Unsaved' })
  await tick()
  await assert.rejects(saver.flush())
  assert.equal(saver.failed, true)
  failing = false
  const retry = saver.flush()
  await tick()
  resolveWrite()
  await retry
  assert.equal(written.at(-1), 'Unsaved')
  assert.equal(saver.failed, false)
})

test('an older completion cannot clear a newer failed snapshot', async () => {
  const controls = []
  const saver = new SaveCoordinator(
    (c) => new Promise((resolve, reject) => controls.push({ c, resolve, reject })),
  )
  const c = createContest(fixture())
  saver.save(c)
  saver.save({ ...c, name: 'Newer' })
  await tick()
  controls[0].resolve()
  controls[1].reject(new Error('failure'))
  await tick()
  assert.equal(saver.failed, true)
  const retry = saver.flush()
  await tick()
  assert.equal(controls[2].c.name, 'Newer')
  controls[2].resolve()
  await retry
  assert.equal(saver.failed, false)
})

function electronMock(lock = true) {
  const events = {},
    handles = {},
    messages = {},
    windowEvents = {}
  let window,
    quits = 0,
    saves = 0
  const app = {
    getPath: () => os.tmpdir(),
    requestSingleInstanceLock: () => lock,
    quit: () => {
      quits++
    },
    on: (name, fn) => {
      events[name] = fn
    },
    whenReady: () => Promise.resolve(),
  }
  class Window {
    constructor() {
      window = this
      this.webContents = {
        send: (name, token) => {
          messages[name] = token
        },
        isCrashed: () => false,
      }
    }
    on(name, fn) {
      windowEvents[name] = fn
    }
    maximize() {}
    loadURL() {}
    loadFile() {}
    isDestroyed() {
      return false
    }
    setEnabled(value) {
      this.enabled = value
    }
    close() {
      let prevented = false
      windowEvents.close({
        preventDefault: () => {
          prevented = true
        },
      })
      this.closed = !prevented
    }
    isMinimized() {
      return true
    }
    restore() {
      this.restored = true
    }
    show() {}
    focus() {
      this.focused = true
    }
  }
  const ipcMain = {
    on: (name, fn) => {
      handles[name] = fn
    },
    handle: (name, fn) => {
      handles[name] = fn
    },
  }
  const store = {
    ContestStore: class {
      async flush() {
        saves++
      }
    },
  }
  const module = loader({
    electron: {
      app,
      BrowserWindow: Window,
      ipcMain,
      dialog: { showMessageBox: async () => ({ response: 0 }) },
    },
    './contestStore': store,
  })
  return {
    start: () => module('electron/main.ts'),
    events,
    handles,
    messages,
    window: () => window,
    quits: () => quits,
    saves: () => saves,
  }
}

test('Electron closes only after renderer acknowledgement and storage flush', async () => {
  const mock = electronMock()
  mock.start()
  await tick()
  const window = mock.window()
  mock.handles['renderer-ready']({ sender: window.webContents })
  window.close()
  assert.equal(window.closed, false)
  assert.equal(window.enabled, false)
  const token = mock.messages['prepare-close']
  assert.ok(token)
  await mock.handles['finish-close']({ sender: {} }, token, true)
  assert.equal(window.closed, false)
  await mock.handles['finish-close']({ sender: window.webContents }, token, true)
  assert.equal(window.closed, true)
  assert.equal(mock.saves(), 1)
})

test('Electron keeps the window open on failed flush and rejects a second instance', async () => {
  const mock = electronMock()
  mock.start()
  await tick()
  const window = mock.window()
  mock.handles['renderer-ready']({ sender: window.webContents })
  window.close()
  await mock.handles['finish-close'](
    { sender: window.webContents },
    mock.messages['prepare-close'],
    false,
  )
  assert.equal(window.closed, false)
  assert.equal(window.enabled, true)
  mock.events['second-instance']()
  assert.equal(window.restored, true)
  assert.equal(window.focused, true)
  const second = electronMock(false)
  second.start()
  await tick()
  assert.equal(second.quits(), 1)
  assert.equal(second.window(), undefined)
})
