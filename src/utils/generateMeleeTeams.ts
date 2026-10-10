import type { Player } from '../types/player'
import type { Team } from '../types/team'

interface PairHistory {
[playerId: string]: {
[otherPlayerId: string]: number
}
}

const BYE_TEAM_ID = '**bye**'

function shuffle<T>(array: T[]): T[] {
const result = [...array]

for (let i = result.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1))
;[result[i], result[j]] = [result[j], result[i]]
}

return result
}

function getPairCount(
history: PairHistory,
playerA: string,
playerB: string,
): number {
return history[playerA]?.[playerB] ?? 0
}

function addPair(
history: PairHistory,
playerA: string,
playerB: string,
): void {
history[playerA] ??= {}
history[playerB] ??= {}

history[playerA][playerB] = (history[playerA][playerB] ?? 0) + 1
history[playerB][playerA] = (history[playerB][playerA] ?? 0) + 1
}

function createTeam(players: Player[]): Team {
return { id: crypto.randomUUID(), players }
}

function createByeTeam(): Team {
return { id: BYE_TEAM_ID, players: [] }
}

function isByeTeam(team: Team): boolean {
return team.id === BYE_TEAM_ID
}

function calculateTeammateScore(
teams: Team[],
history: PairHistory,
): number {
let score = 0

for (const team of teams) {
for (let i = 0; i < team.players.length; i++) {
for (let j = i + 1; j < team.players.length; j++) {
score += getPairCount(
history,
team.players[i].id,
team.players[j].id,
)
}
}
}

return score
}

function calculateOpponentScore(
teams: Team[],
history: PairHistory,
): number {
let score = 0

for (let i = 0; i < teams.length; i += 2) {
const teamA = teams[i]
const teamB = teams[i + 1]

if (!teamA || !teamB || isByeTeam(teamA) || isByeTeam(teamB)) {
  continue
}

for (const playerA of teamA.players) {
  for (const playerB of teamB.players) {
    score += getPairCount(history, playerA.id, playerB.id)
  }
}

}

return score
}

function generateCandidateTeams(
players: Player[],
teamSize: 1 | 2 | 3,
): Team[] {
const shuffledPlayers = shuffle(players)
const teams: Team[] = []

for (let i = 0; i < shuffledPlayers.length; i += teamSize) {
teams.push(createTeam(shuffledPlayers.slice(i, i + teamSize)))
}

return teams
}

function recordTeammates(teams: Team[], history: PairHistory): void {
for (const team of teams) {
for (let i = 0; i < team.players.length; i++) {
for (let j = i + 1; j < team.players.length; j++) {
addPair(history, team.players[i].id, team.players[j].id)
}
}
}
}

function recordOpponents(teams: Team[], history: PairHistory): void {
for (let i = 0; i < teams.length; i += 2) {
const teamA = teams[i]
const teamB = teams[i + 1]

if (!teamA || !teamB || isByeTeam(teamA) || isByeTeam(teamB)) {
  continue
}

for (const playerA of teamA.players) {
  for (const playerB of teamB.players) {
    addPair(history, playerA.id, playerB.id)
  }
}

}
}

export function generateMeleeTeams(
players: Player[],
teamSize: 1 | 2 | 3,
numberOfRounds: number,
): Team[][] {
if (players.length < 4) {
throw new Error('Il faut au moins 4 joueurs.')
}

if (numberOfRounds < 1) {
throw new Error('Il faut au moins une partie.')
}

const teammateHistory: PairHistory = {}
const opponentHistory: PairHistory = {}
const byeCounts = new Map<string, number>(
players.map((player) => [player.id, 0]),
)
const rounds: Team[][] = []

for (let round = 0; round < numberOfRounds; round++) {
const remainderCount = players.length % teamSize

const shuffledPlayers = shuffle(players)
const orderedForRest = [...shuffledPlayers].sort(
  (a, b) => (byeCounts.get(a.id) ?? 0) - (byeCounts.get(b.id) ?? 0),
)
const restingPlayers = orderedForRest.slice(0, remainderCount)
const restingIds = new Set(restingPlayers.map((player) => player.id))
const playingPlayers = players.filter(
  (player) => !restingIds.has(player.id),
)

let bestTeams: Team[] | null = null
let bestScore = Infinity

for (let attempt = 0; attempt < 1000; attempt++) {
  const candidateTeams = generateCandidateTeams(playingPlayers, teamSize)
  const score =
    calculateTeammateScore(candidateTeams, teammateHistory) * 100 +
    calculateOpponentScore(candidateTeams, opponentHistory)

  if (score < bestScore) {
    bestTeams = candidateTeams
    bestScore = score
  }
}

if (!bestTeams) {
  throw new Error('Impossible de générer les équipes.')
}

const matchTeams = shuffle(bestTeams)

if (matchTeams.length % 2 !== 0) {
  const byeIndex = round % matchTeams.length
  const [restingTeam] = matchTeams.splice(byeIndex, 1)
  matchTeams.push(restingTeam, createByeTeam())

  for (const player of restingTeam.players) {
    byeCounts.set(player.id, (byeCounts.get(player.id) ?? 0) + 1)
  }
}

if (restingPlayers.length > 0) {
  matchTeams.push(createTeam(restingPlayers), createByeTeam())

  for (const player of restingPlayers) {
    byeCounts.set(player.id, (byeCounts.get(player.id) ?? 0) + 1)
  }
}

recordTeammates(matchTeams, teammateHistory)
recordOpponents(matchTeams, opponentHistory)
rounds.push(matchTeams)

}

return rounds
}
