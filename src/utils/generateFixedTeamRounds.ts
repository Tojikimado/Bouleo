import type { Team } from '../types/team'

function shuffle<T>(array: T[]): T[] {
const result = [...array]

for (let i = result.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() * (i + 1))
;[result[i], result[j]] = [result[j], result[i]]
}

return result
}

export function generateFixedTeams(
teams: Team[],
numberOfRounds: number,
): Team[][] {
if (teams.length < 4) {
throw new Error('Il faut au moins 4 équipes.')
}

if (numberOfRounds < 1) {
throw new Error('Il faut au moins une partie.')
}

const shuffledTeams = shuffle(teams)
const hasBye = shuffledTeams.length % 2 !== 0

const byeTeam: Team = {
id: '**bye**',
players: [],
}

const rotatingTeams = hasBye
? [...shuffledTeams, byeTeam]
: [...shuffledTeams]

const rounds: Team[][] = []
const rotationSize = rotatingTeams.length

for (let roundNumber = 0; roundNumber < numberOfRounds; roundNumber++) {
const currentTeams = [...rotatingTeams]

for (let i = 0; i < roundNumber % (rotationSize - 1); i++) {
  currentTeams.splice(1, 0, currentTeams.pop()!)
}

const roundTeams: Team[] = []

for (let i = 0; i < rotationSize / 2; i++) {
  const teamA = currentTeams[i]
  const teamB = currentTeams[rotationSize - 1 - i]

  roundTeams.push(teamA, teamB)
}

rounds.push(roundTeams)

}

return rounds
}
