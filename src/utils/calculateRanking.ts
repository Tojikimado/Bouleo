import type { Contest } from '../types/contest'
import type { Player } from '../types/player'
import type { Team } from '../types/team'

export interface RankingEntry {
  id: string
  name: string
  wins: number
  losses: number
  goalAverage: number
}

export function calculateRanking(
  contest: Contest,
): RankingEntry[] {
  if (contest.mode === 'fixed-teams') {
    return calculateFixedTeamsRanking(contest)
  }

  return calculateMeleeRanking(contest)
}

function calculateFixedTeamsRanking(
  contest: Contest,
): RankingEntry[] {
  const ranking = new Map<string, RankingEntry>()

  for (const team of contest.teams) {
    ranking.set(team.id, {
      id: team.id,
      name: getTeamName(team),
      wins: 0,
      losses: 0,
      goalAverage: 0,
    })
  }

  for (const round of contest.rounds) {
    for (const match of round.matches) {
      if (
        match.scoreA === null ||
        match.scoreB === null
      ) {
        continue
      }

      const teamA = ranking.get(match.teamA.id)!
      const teamB = ranking.get(match.teamB.id)!

      const difference = match.scoreA - match.scoreB

      teamA.goalAverage += difference
      teamB.goalAverage -= difference

      if (match.scoreA > match.scoreB) {
        teamA.wins++
        teamB.losses++
      } else if (match.scoreB > match.scoreA) {
        teamB.wins++
        teamA.losses++
      }
    }
  }

  return sortRanking([...ranking.values()])
}

function calculateMeleeRanking(
  contest: Contest,
): RankingEntry[] {
  const ranking = new Map<string, RankingEntry>()

  for (const player of contest.players) {
    ranking.set(player.id, {
      id: player.id,
      name: player.name,
      wins: 0,
      losses: 0,
      goalAverage: 0,
    })
  }

  for (const round of contest.rounds) {
    for (const match of round.matches) {
      if (
        match.scoreA === null ||
        match.scoreB === null
      ) {
        continue
      }

      const difference =
        match.scoreA - match.scoreB

      const teamAWon = match.scoreA > match.scoreB
      const teamBWon = match.scoreB > match.scoreA

      for (const player of match.teamA.players) {
        const entry = ranking.get(player.id)!

        entry.goalAverage += difference

        if (teamAWon) {
          entry.wins++
        } else if (teamBWon) {
          entry.losses++
        }
      }

      for (const player of match.teamB.players) {
        const entry = ranking.get(player.id)!

        entry.goalAverage -= difference

        if (teamBWon) {
          entry.wins++
        } else if (teamAWon) {
          entry.losses++
        }
      }
    }
  }

  return sortRanking([...ranking.values()])
}

function sortRanking(
  ranking: RankingEntry[],
): RankingEntry[] {
  return ranking.sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins
    }

    return b.goalAverage - a.goalAverage
  })
}

function getTeamName(team: Team): string {
  return team.players
    .map((player: Player) => player.name)
    .join(' + ')
}