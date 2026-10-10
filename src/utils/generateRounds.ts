import type { Match } from '../types/match'
import type { Round } from '../types/contest'
import type { Team } from '../types/team'

function isByeTeam(team: Team | undefined): boolean {
return team !== undefined && team.players.length === 0
}

export function generateRounds(
teamsByRound: Team[][],
): Round[] {
return teamsByRound.map((teams, roundIndex) => {
const matches: Match[] = []

for (let i = 0; i < teams.length; i += 2) {
  const firstTeam = teams[i]
  const secondTeam = teams[i + 1]

  if (!firstTeam) continue

  const firstIsBye = isByeTeam(firstTeam)
  const secondIsBye = isByeTeam(secondTeam)

  if (firstIsBye && secondIsBye) {
    continue
  }

  if (firstIsBye || secondIsBye) {
    const restingTeam = firstIsBye ? secondTeam : firstTeam

    if (!restingTeam || isByeTeam(restingTeam)) continue

    matches.push({
      id: crypto.randomUUID(),
      teamA: restingTeam,
      teamB: null,
      scoreA: 13,
      scoreB: 7,
      isBye: true,
    })

    continue
  }

  if (!secondTeam) continue

  matches.push({
    id: crypto.randomUUID(),
    teamA: firstTeam,
    teamB: secondTeam,
    scoreA: null,
    scoreB: null,
    isBye: false,
  })
}

return {
  id: crypto.randomUUID(),
  number: roundIndex + 1,
  matches,
}

})
}
