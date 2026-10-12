const test = require('node:test')
const assert = require('node:assert/strict')
const { loader, fixture, hookHarness, find } = require('./helpers.cjs')
const load = loader()
const { createContest } = load('src/utils/createContest.ts')
const { updateContest, requiresRegeneration } = load('src/utils/updateContest.ts')
const { assertContest, parseSavedContest } = load('src/utils/contestValidation.ts')
const { calculateRanking } = load('src/utils/calculateRanking.ts')

test('deleting several saved contests retains failures and retries only those files', async (t) => {
  const h = hookHarness()
  const component = loader({
    react: { ...h.react, useEffect() {} },
    '../../components/ConfirmModal/ConfirmModal': { __esModule: true, default: 'Modal' },
  })('src/pages/OpenContest/OpenContestPage.tsx').default
  const previousWindow = global.window
  t.after(() => {
    global.window = previousWindow
  })
  const deleted = []
  let failSecond = true
  global.window = {
    bouleo: {
      async deleteContest(id) {
        deleted.push(id)
        if (id === 'second' && failSecond) throw new Error('File unavailable')
        return true
      },
    },
  }
  const render = () => {
    h.reset()
    return component({ onBack() {}, onOpenContest() {} })
  }
  render()
  // Simuler une liste chargée. Les autres actions passent par les boutons du composant.
  h.state[0] = [
    { id: 'first', name: 'Premier' },
    { id: 'second', name: 'Deuxième' },
  ]
  h.state[6] = false
  find(
    render(),
    (e) => e.props?.className === 'open-contest-manage-toggle',
  ).props.onClick()
  find(render(), (e) => e.props?.className === 'open-contest-select-all').props.onClick()
  find(
    render(),
    (e) => e.props?.className === 'open-contest-delete-selected',
  ).props.onClick()
  await find(render(), (e) => e.type === 'Modal').props.onConfirm()
  assert.deepEqual(
    h.state[0].map((contest) => contest.id),
    ['second'],
  )
  assert.match(find(render(), (e) => e.type === 'Modal').props.message, /1 suppression/)
  failSecond = false
  await find(render(), (e) => e.type === 'Modal').props.onConfirm()
  assert.deepEqual(deleted, ['first', 'second', 'second'])
  assert.equal(h.state[0].length, 0)
  assert.equal(find(render(), (e) => e.type === 'Modal').props.open, false)
})

test('participant action preserves existing rounds unless configuration or membership changes', () => {
  for (const mode of ['fixed-teams', 'melee-demelee']) {
    const h = hookHarness()
    const component = loader({ react: h.react })(
      'src/pages/Participants/ParticipantsPage.tsx',
    ).default
    const contest = createContest(fixture(6, mode))
    const props = { ...contest, contest }
    const render = () => {
      h.reset()
      return component(props)
    }
    const action = () =>
      find(
        render(),
        (e) => e.props?.className === 'participants-continue',
      ).props.children.join('')
    assert.match(action(), /^Continuer/)
    find(render(), (e) => e.type === 'input').props.onChange({
      target: { value: 'Renamed' },
    })
    assert.match(action(), /^Continuer/)
    props.totalRounds++
    assert.match(action(), /^Générer/)
    props.totalRounds--
    assert.match(action(), /^Continuer/)
    find(
      render(),
      (e) =>
        e.props?.className ===
        (mode === 'fixed-teams' ? 'team-remove-button' : 'player-remove-button'),
    ).props.onClick()
    assert.match(action(), /^Générer/)
    props.contest = null
    assert.match(action(), /^Générer/)
  }
})

test('score errors wait for both values and disappear after correction', () => {
  const component = load('src/pages/Contest/ContestPage.tsx').default
  const contest = createContest(fixture())
  const match = contest.rounds[0].matches[0]
  const render = () => component({ contest })
  assert.equal(
    find(render(), (e) => e.props?.className === 'match-error'),
    undefined,
  )
  match.scoreA = 8
  assert.equal(
    find(render(), (e) => e.props?.className === 'match-error'),
    undefined,
  )
  match.scoreB = 9
  assert.equal(
    find(render(), (e) => e.props?.className === 'match-error').props.role,
    'alert',
  )
  assert.equal(
    find(render(), (e) => e.props?.invalid === true).props.describedBy,
    `match-status-${match.id}`,
  )
  match.scoreA = 13
  assert.equal(
    find(render(), (e) => e.props?.className === 'match-error'),
    undefined,
  )
  match.scoreB = 13
  assert.ok(find(render(), (e) => e.props?.className === 'match-error'))
})

test('reject fractional, infinite and excessive round counts', () => {
  for (const value of [0, -1, 1.5, Infinity, NaN, 101])
    assert.throws(() => createContest({ ...fixture(), totalRounds: value }))
})

test('configuration changes regenerate atomically and do not mutate the original', () => {
  const original = createContest(fixture())
  const snapshot = JSON.stringify(original)
  const next = updateContest(
    original,
    { ...original, totalRounds: 5 },
    original.players,
    original.teams,
  )
  assert.equal(next.rounds.length, 5)
  assert.equal(next.id, original.id)
  assert.equal(next.currentRound, 1)
  assert.equal(JSON.stringify(original), snapshot)
  assertContest(next)
})

test('renaming preserves scores and byes; replacing a player regenerates', () => {
  const original = createContest(fixture(5, 'melee-demelee'))
  for (const r of original.rounds)
    for (const m of r.matches) {
      m.scoreA = 13
      m.scoreB = 7
    }
  const renamed = original.players.map((p) => ({ ...p, name: p.name + ' renamed' }))
  const next = updateContest(original, original, renamed, [])
  assert.deepEqual(
    next.rounds.map((r) => r.id),
    original.rounds.map((r) => r.id),
  )
  assertContest(next)
  const replaced = [...renamed.slice(1), { id: 'new-player', name: 'New' }]
  assert.ok(requiresRegeneration(original, original, replaced, []))
  const reset = updateContest(original, original, replaced, [])
  assert.ok(
    reset.rounds
      .flatMap((r) => r.matches)
      .filter((m) => !m.isBye)
      .every((m) => m.scoreA === null),
  )
  assertContest(reset)
})

test('fixed teams meet once per complete cycle and everyone appears once per round', () => {
  for (let n = 4; n <= 11; n++) {
    const c = createContest(fixture(n, 'fixed-teams', 'tete-a-tete', n % 2 ? n : n - 1))
    assertContest(c)
    const pairs = new Set()
    for (const r of c.rounds)
      for (const m of r.matches)
        if (m.teamB) {
          const key = [m.teamA.id, m.teamB.id].sort().join(':')
          assert.ok(!pairs.has(key))
          pairs.add(key)
        }
  }
})

test('melee keeps optimized opponents and balances all exemptions', () => {
  const random = Math.random
  try {
    for (let initial = 1; initial <= 10; initial++) {
      let seed = initial
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed / 4294967296
      }
      const c = createContest(fixture(4, 'melee-demelee'))
      const pairs = c.rounds.flatMap((r) =>
        r.matches.map((m) =>
          [m.teamA.players[0].id, m.teamB.players[0].id].sort().join(':'),
        ),
      )
      assert.equal(new Set(pairs).size, 6)
      for (const [size, format] of [
        [1, 'tete-a-tete'],
        [2, 'doublette'],
        [3, 'triplette'],
      ]) {
        for (let n = size * 4; n < size * 6; n++) {
          const contest = createContest(fixture(n, 'melee-demelee', format, 5))
          assertContest(contest)
          const rests = new Map(contest.players.map((p) => [p.id, 0]))
          for (const round of contest.rounds) {
            for (const match of round.matches)
              if (match.isBye)
                for (const p of match.teamA.players) rests.set(p.id, rests.get(p.id) + 1)
            assert.ok(Math.max(...rests.values()) - Math.min(...rests.values()) <= 1)
          }
        }
      }
    }
  } finally {
    Math.random = random
  }
})

test('ties retain ranks 1, 2, 2, 4 in both modes', () => {
  const c = createContest(fixture())
  const t = c.teams
  c.rounds = [
    {
      matches: [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
      ].map(([a, b]) => ({ teamA: t[a], teamB: t[b], scoreA: 13, scoreB: 7 })),
    },
  ]
  for (const mode of ['fixed-teams', 'melee-demelee'])
    assert.deepEqual(
      calculateRanking({ ...c, mode }).map((e) => e.rank),
      [1, 2, 2, 4],
    )
})

test('saved data rejects unknown versions, malformed structures, IDs and scores', () => {
  const original = createContest(fixture())
  const encode = (c = original, version = 1) =>
    JSON.stringify({ version, savedAt: new Date().toISOString(), contest: c })
  assert.deepEqual(parseSavedContest(encode(), original.id).contest, original)
  assert.throws(() => parseSavedContest(encode(original, 999), original.id))
  assert.throws(() => parseSavedContest(encode({ id: original.id }), original.id))
  assert.throws(() => parseSavedContest(encode(), 'different-id'))
  for (const change of [
    (c) => (c.format = ['tete-a-tete']),
    (c) => (c.mode = ['fixed-teams']),
    (c) => c.rounds.pop(),
    (c) => c.players.push(c.players[0]),
    (c) => (c.rounds[0].matches[0].scoreA = 14),
    (c) => (c.rounds[0].matches[0].teamA.players[0].id = 'unknown'),
    (c) => (c.currentRound = 0),
  ]) {
    const invalid = JSON.parse(JSON.stringify(original))
    change(invalid)
    assert.throws(() => assertContest(invalid))
  }
})

test('participant form preserves identities after removing and adding a player', () => {
  const h = hookHarness()
  const component = loader({ react: h.react })(
    'src/pages/Participants/ParticipantsPage.tsx',
  ).default
  let result
  const c = createContest(fixture(4, 'melee-demelee'))
  const render = () => {
    h.reset()
    return component({
      contest: c,
      ...c,
      onContinue: (p) => {
        result = p
      },
    })
  }
  let tree = render()
  find(tree, (e) => e.props?.className === 'player-remove-button').props.onClick()
  tree = render()
  find(tree, (e) => e.props?.className === 'participants-add-button').props.onClick()
  tree = render()
  // Use the blank input to name the newly added player.
  find(tree, (e) => e.type === 'input' && e.props.value === '').props.onChange({
    target: { value: 'New' },
  })
  tree = render()
  find(tree, (e) => e.props?.className === 'participants-continue').props.onClick()
  assert.deepEqual(
    result.slice(0, 3).map((p) => p.id),
    c.players.slice(1).map((p) => p.id),
  )
  assert.ok(!c.players.some((p) => p.id === result[3].id))
  assert.equal(result[3].name, 'New')
})

test('App configuration round trip keeps saved state until confirmation', () => {
  const h = hookHarness()
  const pages = Object.fromEntries(
    ['Home', 'NewContest', 'Participants', 'Contest', 'Ranking', 'OpenContest'].map(
      (name) => [`./pages/${name}/${name}Page`, { __esModule: true, default: name }],
    ),
  )
  const App = loader({
    react: h.react,
    ...pages,
    './components/ConfirmModal/ConfirmModal': { __esModule: true, default: 'Modal' },
    './utils/useContestSaving': {
      useContestSaving: () => ({ status: '', failed: false }),
    },
  })('src/App.tsx').default
  const c = createContest(fixture())
  c.rounds[0].matches[0].scoreA = 13
  h.state[0] = 'new-contest'
  h.state[1] = c
  const render = () => {
    h.reset()
    return App()
  }
  const page = (name) => find(render(), (e) => e.type === name)
  page('NewContest').props.onContinue(c.name, 5, c.format, c.mode)
  assert.equal(h.state[1], c)
  const draft = {
    players: c.players.map((player) => ({ ...player, name: player.name + ' edited' })),
    teams: c.teams,
  }
  page('Participants').props.onBack(draft)
  assert.equal(page('NewContest').props.contest.totalRounds, 5)
  page('NewContest').props.onContinue(c.name, 5, c.format, c.mode)
  assert.equal(page('Participants').props.draft, draft)
  page('Participants').props.onContinue(c.players, c.teams)
  assert.equal(h.state[1], c)
  page('Modal').props.onCancel()
  assert.equal(h.state[1], c)
  page('Participants').props.onContinue(c.players, c.teams)
  page('Modal').props.onConfirm()
  assert.equal(h.state[1].rounds.length, 5)
  assert.equal(h.state[1].id, c.id)
})

test('participant drafts keep unconfirmed names and identities across remounts in both modes', () => {
  for (const mode of ['fixed-teams', 'melee-demelee']) {
    const c = createContest(fixture(8, mode, 'doublette'))
    const original = JSON.stringify(c)
    let draft = null
    function mount() {
      const hooks = hookHarness()
      const Component = loader({ react: hooks.react })(
        'src/pages/Participants/ParticipantsPage.tsx',
      ).default
      return () => {
        hooks.reset()
        return Component({
          ...c,
          contest: c,
          draft,
          onBack: (value) => {
            draft = value
          },
        })
      }
    }
    let render = mount()
    find(
      render(),
      (e) => e.type === 'input' && e.props.value === 'Player 0',
    ).props.onChange({ target: { value: 'Renamed' } })
    find(render(), (e) => e.props?.className === 'participants-back').props.onClick()
    render = mount()
    assert.ok(find(render(), (e) => e.type === 'input' && e.props.value === 'Renamed'))
    const edited = mode === 'fixed-teams' ? draft.teams[0].players[0] : draft.players[0]
    assert.equal(edited.id, c.players[0].id)
    assert.equal(JSON.stringify(c), original)
  }
})

test('ranking handles byes and unfinished matches identically in both modes', () => {
  const c = createContest(fixture(5))
  const teams = c.teams
  c.rounds = [
    {
      matches: [
        { teamA: teams[0], teamB: teams[1], scoreA: 13, scoreB: 0 },
        { teamA: teams[2], teamB: teams[3], scoreA: 13, scoreB: null },
        { teamA: teams[4], teamB: null, isBye: true, scoreA: 13, scoreB: 7 },
      ],
    },
  ]
  for (const mode of ['fixed-teams', 'melee-demelee']) {
    const ranking = calculateRanking({ ...c, mode })
    assert.deepEqual(
      ranking.map(({ name, wins, losses, goalAverage, rank }) => ({
        name,
        wins,
        losses,
        goalAverage,
        rank,
      })),
      [
        { name: 'Player 0', wins: 1, losses: 0, goalAverage: 13, rank: 1 },
        { name: 'Player 4', wins: 1, losses: 0, goalAverage: 6, rank: 2 },
        { name: 'Player 2', wins: 0, losses: 0, goalAverage: 0, rank: 3 },
        { name: 'Player 3', wins: 0, losses: 0, goalAverage: 0, rank: 3 },
        { name: 'Player 1', wins: 0, losses: 1, goalAverage: -13, rank: 5 },
      ],
    )
  }
})
