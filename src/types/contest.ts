import type { Player } from './player'
import type { Team } from './team'
import type { Match } from './match'

export type ContestFormat = 'tete-a-tete' | 'doublette' | 'triplette'

export type ContestMode = 'fixed-teams' | 'melee-demelee'

export interface Round {
  id: string
  number: number
  matches: Match[]
}

export interface Contest {
  id: string
  name: string
  totalRounds: number

  format: ContestFormat
  mode: ContestMode

  players: Player[]
  teams: Team[]

  rounds: Round[]

  currentRound: number
}

export type ContestConfiguration = Pick<
  Contest,
  'name' | 'totalRounds' | 'format' | 'mode'
>

// État du formulaire, conservé en mémoire avant validation du concours.
export interface ParticipantsDraft {
  players: Player[]
  teams: Team[]
}
