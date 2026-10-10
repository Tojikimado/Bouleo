import type { Contest, ContestConfiguration } from '../types/contest'
import type { Player } from '../types/player'
import type { Team } from '../types/team'
import { createContest } from './createContest'
import { isByeMatch, isScore } from './contestRules'

function sameIds(first: { id: string }[], second: { id: string }[]): boolean {
  const ids = new Set(second.map((item) => item.id))
  return first.length === second.length && first.every((item) => ids.has(item.id))
}

export function requiresRegeneration(
  current: Contest | null,
  config: ContestConfiguration,
  players: Player[],
  teams: Team[],
): boolean {
  if (
    !current ||
    !current.rounds.length ||
    current.totalRounds !== config.totalRounds ||
    current.format !== config.format ||
    current.mode !== config.mode
  )
    return true
  if (!sameIds(current.players, players)) return true
  return (
    config.mode === 'fixed-teams' &&
    (!sameIds(current.teams, teams) ||
      current.teams.some(
        (team) =>
          !sameIds(
            team.players,
            teams.find((next) => next.id === team.id)?.players ?? [],
          ),
      ))
  )
}

export function hasRecordedScores(contest: Contest): boolean {
  return contest.rounds.some((round) =>
    round.matches.some(
      (match) => !isByeMatch(match) && (match.scoreA !== null || match.scoreB !== null),
    ),
  )
}

export function setMatchScore(
  contest: Contest,
  roundId: string,
  matchId: string,
  side: 'A' | 'B',
  score: number | null,
): Contest {
  if (score !== null && !isScore(score)) return contest
  return {
    ...contest,
    rounds: contest.rounds.map((round) =>
      round.id !== roundId
        ? round
        : {
            ...round,
            matches: round.matches.map((match) =>
              match.id !== matchId || isByeMatch(match)
                ? match
                : {
                    ...match,
                    [side === 'A' ? 'scoreA' : 'scoreB']: score,
                  },
            ),
          },
    ),
  }
}

export function moveRound(contest: Contest, direction: -1 | 1): Contest {
  const currentRound = Math.min(
    contest.totalRounds,
    Math.max(1, contest.currentRound + direction),
  )
  return currentRound === contest.currentRound ? contest : { ...contest, currentRound }
}

export function updateContest(
  current: Contest | null,
  config: ContestConfiguration,
  players: Player[],
  teams: Team[],
): Contest {
  if (requiresRegeneration(current, config, players, teams) || !current) {
    const generated = createContest({ ...config, players, teams })
    return { ...generated, id: current?.id ?? generated.id }
  }
  const byId = new Map(players.map((p) => [p.id, p]))
  const rename = (team: Team): Team => ({
    ...team,
    players: team.players.map((p) => byId.get(p.id) ?? p),
  })
  return {
    ...current,
    ...config,
    players,
    teams,
    rounds: current.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) => ({
        ...match,
        teamA: rename(match.teamA),
        teamB: match.teamB ? rename(match.teamB) : null,
      })),
    })),
  }
}
