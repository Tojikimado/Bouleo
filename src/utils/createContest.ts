import type { Contest, ContestFormat, ContestMode } from '../types/contest'
import type { Player } from '../types/player'
import type { Team } from '../types/team'

import { generateFixedTeams } from './generateFixedTeamRounds'
import { generateMeleeTeams } from './generateMeleeTeams'
import { generateRounds } from './generateRounds'

interface CreateContestOptions {
  name: string
  totalRounds: number
  format: ContestFormat
  mode: ContestMode
  players: Player[]
  teams: Team[]
}

function getTeamSize(
  format: ContestFormat,
): 1 | 2 | 3 {
  switch (format) {
    case 'tete-a-tete':
      return 1

    case 'doublette':
      return 2

    case 'triplette':
      return 3
  }
}

export function createContest(
  options: CreateContestOptions,
): Contest {
  const {
    name,
    totalRounds,
    format,
    mode,
    players,
    teams,
  } = options

  let rounds

  if (mode === 'fixed-teams') {
    const teamsByRound = generateFixedTeams(
      teams,
      totalRounds,
    )

    rounds = generateRounds(teamsByRound)
  } else {
    const teamSize = getTeamSize(format)

    const teamsByRound = generateMeleeTeams(
      players,
      teamSize === 1 ? 2 : teamSize,
      totalRounds,
    )

    rounds = generateRounds(teamsByRound)
  }

  return {
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
}