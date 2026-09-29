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

  if (teams.length % 2 !== 0) {
    throw new Error(
      'Le nombre d’équipes doit être pair pour générer les parties.',
    )
  }

  if (numberOfRounds < 1) {
    throw new Error('Il faut au moins une partie.')
  }

  const shuffledTeams = shuffle(teams)

  const fixedTeam = shuffledTeams[0]
  const rotatingTeams = shuffledTeams.slice(1)

  const rounds: Team[][] = []

  const uniqueRounds = teams.length - 1

  for (let roundNumber = 0; roundNumber < numberOfRounds; roundNumber++) {
    const currentRotation = [...rotatingTeams]

    for (let i = 0; i < roundNumber % uniqueRounds; i++) {
      currentRotation.push(currentRotation.shift()!)
    }

    const currentTeams = [fixedTeam, ...currentRotation]

    const roundTeams: Team[] = []

    for (let i = 0; i < currentTeams.length / 2; i++) {
      roundTeams.push(currentTeams[i])
      roundTeams.push(
        currentTeams[currentTeams.length - 1 - i],
      )
    }

    rounds.push(roundTeams)
  }

  return rounds
}