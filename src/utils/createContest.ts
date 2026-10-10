import type { Contest, ContestFormat, ContestMode } from '../types/contest'
import type { Player } from '../types/player'
import type { Team } from '../types/team'

import { generateFixedTeams } from './generateFixedTeamRounds'
import { generateMeleeTeams } from './generateMeleeTeams'
import { generateRounds } from './generateRounds'
import { assertContest } from './contestValidation'
import { assertRoundCount, getTeamSize } from './contestRules'

interface CreateContestOptions {
  name: string
  totalRounds: number
  format: ContestFormat
  mode: ContestMode
  players: Player[]
  teams: Team[]
}

export function createContest(options: CreateContestOptions): Contest {
  const { name, totalRounds, format, mode, players, teams } = options

  assertRoundCount(totalRounds)
  let rounds

  if (mode === 'fixed-teams') {
    const teamsByRound = generateFixedTeams(teams, totalRounds)

    rounds = generateRounds(teamsByRound)
  } else {
    const teamSize = getTeamSize(format)

    const teamsByRound = generateMeleeTeams(players, teamSize, totalRounds)

    rounds = generateRounds(teamsByRound)
  }

  const result: Contest = {
    id: crypto.randomUUID(),
    name,
    totalRounds,
    format,
    mode,
    players,
    teams,
    rounds,
    currentRound: 1,
  }
  assertContest(result)
  return result
}
