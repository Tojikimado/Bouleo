const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

// Charger les sources en mémoire, sans générer de fichiers ni lancer Electron.
function loader(overrides = {}) {
  const cache = new Map()
  function load(file) {
    const absolute = path.resolve(file)
    if (cache.has(absolute)) return cache.get(absolute).exports
    const module = { exports: {} }
    cache.set(absolute, module)
    const source = fs
      .readFileSync(absolute, 'utf8')
      .replaceAll(
        'import.meta.url',
        JSON.stringify(require('node:url').pathToFileURL(absolute).href),
      )
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
    const localRequire = (name) => {
      if (name in overrides) return overrides[name]
      if (name.endsWith('.css')) return {}
      if (!name.startsWith('.')) return require(name)
      const base = path.resolve(path.dirname(absolute), name)
      const target = [base, base + '.ts', base + '.tsx'].find((p) => fs.existsSync(p))
      return load(target)
    }
    new Function('require', 'module', 'exports', code)(
      localRequire,
      module,
      module.exports,
    )
    return module.exports
  }
  return load
}

function fixture(
  count = 4,
  mode = 'fixed-teams',
  format = 'tete-a-tete',
  totalRounds = 3,
) {
  const players = Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
  }))
  const size = format === 'triplette' ? 3 : format === 'doublette' ? 2 : 1
  const teams = []
  if (mode === 'fixed-teams')
    for (let i = 0; i < count; i += size)
      teams.push({ id: `t${i}`, players: players.slice(i, i + size) })
  return { name: 'Test', totalRounds, mode, format, players, teams }
}

function hookHarness() {
  const state = []
  let index = 0
  return {
    state,
    reset: () => {
      index = 0
    },
    react: {
      useState(initial) {
        const slot = index++
        if (!(slot in state))
          state[slot] = typeof initial === 'function' ? initial() : initial
        return [
          state[slot],
          (value) => {
            state[slot] = typeof value === 'function' ? value(state[slot]) : value
          },
        ]
      },
    },
  }
}

function find(element, predicate) {
  if (!element || typeof element !== 'object') return undefined
  if (predicate(element)) return element
  for (const child of [element.props?.children].flat(Infinity)) {
    const result = find(child, predicate)
    if (result) return result
  }
}
module.exports = { loader, fixture, hookHarness, find }
