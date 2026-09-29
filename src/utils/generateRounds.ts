import type { Match } from '../types/match'
import type { Round } from '../types/contest'
import type { Team } from '../types/team'

export function generateRounds(
  teamsByRound: Team[][],
): Round[] {
  return teamsByRound.map((teams, roundIndex) => {
    const matches: Match[] = []

    for (let i = 0; i < teams.length; i += 2) {
      matches.push({
        id: crypto.randomUUID(),
        teamA: teams[i],
        teamB: teams[i + 1],
        scoreA: null,
        scoreB: null,
      })
    }

    return {
      id: crypto.randomUUID(),
      number: roundIndex + 1,
      matches,
    }
  })
}