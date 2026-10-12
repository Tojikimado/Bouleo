import type { Contest } from '../types/contest'
import type { Team } from '../types/team'
import { isByeMatch } from './contestRules'

export interface RankingEntry {
  id: string
  name: string
  rank: number
  wins: number
  losses: number
  goalAverage: number
}

export function calculateRanking(contest: Contest): RankingEntry[] {
  const fixedTeams = contest.mode === 'fixed-teams'
  const participants = fixedTeams
    ? contest.teams.map((team) => ({
        id: team.id,
        name: team.players.map((player) => player.name).join(' / '),
      }))
    : contest.players
  const entries = new Map<string, RankingEntry>(
    participants.map(({ id, name }) => [
      id,
      { id, name, rank: 0, wins: 0, losses: 0, goalAverage: 0 },
    ]),
  )

  function addResult(team: Team, scored: number, conceded: number) {
    const ids = fixedTeams ? [team.id] : team.players.map((player) => player.id)
    for (const id of ids) {
      const entry = entries.get(id)
      if (!entry) {
        continue
      }
      entry.goalAverage += scored - conceded
      if (scored > conceded) {
        entry.wins++
      }
      if (scored < conceded) {
        entry.losses++
      }
    }
  }

  for (const round of contest.rounds) {
    for (const match of round.matches) {
      if (match.scoreA === null || match.scoreB === null) {
        continue
      }
      addResult(match.teamA, match.scoreA, match.scoreB)
      if (!isByeMatch(match) && match.teamB) {
        addResult(match.teamB, match.scoreB, match.scoreA)
      }
    }
  }

  const ranking = [...entries.values()].sort(
    (first, second) => second.wins - first.wins || second.goalAverage - first.goalAverage,
  )
  for (const [index, entry] of ranking.entries()) {
    const previous = ranking[index - 1]
    const tied =
      previous &&
      previous.wins === entry.wins &&
      previous.goalAverage === entry.goalAverage
    entry.rank = tied ? previous.rank : index + 1
  }
  return ranking
}
