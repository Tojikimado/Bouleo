import type { Team } from '../types/team'
import { assertRoundCount, BYE_TEAM_ID, MIN_TEAMS } from './contestRules'
import { shuffle } from './shuffle'

export function generateFixedTeams(teams: Team[], numberOfRounds: number): Team[][] {
  if (teams.length < MIN_TEAMS) {
    throw new Error('Il faut au moins 4 équipes.')
  }

  assertRoundCount(numberOfRounds)

  const shuffledTeams = shuffle(teams)
  const hasBye = shuffledTeams.length % 2 !== 0

  const byeTeam: Team = {
    id: BYE_TEAM_ID,
    players: [],
  }

  const rotatingTeams = hasBye ? [...shuffledTeams, byeTeam] : [...shuffledTeams]

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
