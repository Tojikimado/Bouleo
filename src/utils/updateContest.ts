import type { Contest, ContestConfiguration } from '../types/contest'
import type { Player } from '../types/player'
import type { Team } from '../types/team'
import { createContest } from './createContest'
import { isByeMatch, isScore } from './contestRules'

// Les noms peuvent changer. Ce sont les identifiants qui représentent les participants.
function sameIds(first: { id: string }[], second: { id: string }[]): boolean {
  if (first.length !== second.length) {
    return false
  }
  const secondIds = new Set(second.map((item) => item.id))
  return first.every((item) => secondIds.has(item.id))
}

export function requiresRegeneration(
  current: Contest | null,
  config: ContestConfiguration,
  players: Player[],
  teams: Team[],
): boolean {
  if (!current || current.rounds.length === 0) {
    return true
  }

  const rulesChanged =
    current.totalRounds !== config.totalRounds ||
    current.format !== config.format ||
    current.mode !== config.mode
  if (rulesChanged || !sameIds(current.players, players)) {
    return true
  }

  if (config.mode !== 'fixed-teams') {
    return false
  }
  if (!sameIds(current.teams, teams)) {
    return true
  }
  for (const team of current.teams) {
    const nextTeam = teams.find((next) => next.id === team.id)
    if (!nextTeam || !sameIds(team.players, nextTeam.players)) {
      return true
    }
  }
  return false
}

export function hasRecordedScores(contest: Contest): boolean {
  for (const round of contest.rounds) {
    for (const match of round.matches) {
      if (!isByeMatch(match) && (match.scoreA !== null || match.scoreB !== null)) {
        return true
      }
    }
  }
  return false
}

export function setMatchScore(
  contest: Contest,
  roundId: string,
  matchId: string,
  side: 'A' | 'B',
  score: number | null,
): Contest {
  if (score !== null && !isScore(score)) {
    return contest
  }

  // React doit recevoir de nouveaux objets pour afficher la modification.
  // Les autres parties et les autres matchs sont conservés tels quels.
  const rounds = contest.rounds.map((round) => {
    if (round.id !== roundId) {
      return round
    }
    const matches = round.matches.map((match) => {
      if (match.id !== matchId || isByeMatch(match)) {
        return match
      }
      if (side === 'A') {
        return { ...match, scoreA: score }
      }
      return { ...match, scoreB: score }
    })
    return { ...round, matches }
  })
  return { ...contest, rounds }
}

export function moveRound(contest: Contest, direction: -1 | 1): Contest {
  const nextRound = contest.currentRound + direction
  if (nextRound < 1 || nextRound > contest.totalRounds) {
    return contest
  }
  return { ...contest, currentRound: nextRound }
}

export function updateContest(
  current: Contest | null,
  config: ContestConfiguration,
  players: Player[],
  teams: Team[],
): Contest {
  if (!current || requiresRegeneration(current, config, players, teams)) {
    const generated = createContest({ ...config, players, teams })
    return { ...generated, id: current?.id ?? generated.id }
  }

  // Chercher un joueur par identifiant sans parcourir toute la liste à chaque match.
  const playersById = new Map(players.map((player) => [player.id, player]))
  function renameTeam(team: Team): Team {
    const renamedPlayers = team.players.map((player) => {
      return playersById.get(player.id) ?? player
    })
    return { ...team, players: renamedPlayers }
  }

  // Un changement de nom conserve les rencontres, les exemptions et les scores.
  const rounds = current.rounds.map((round) => {
    const matches = round.matches.map((match) => ({
      ...match,
      teamA: renameTeam(match.teamA),
      teamB: match.teamB ? renameTeam(match.teamB) : null,
    }))
    return { ...round, matches }
  })
  return { ...current, ...config, players, teams, rounds }
}
