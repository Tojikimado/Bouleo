import type { ContestFormat, ContestMode } from '../types/contest'
import type { Match } from '../types/match'

export const MIN_TEAMS = 4
export const MAX_ROUNDS = 100
export const WINNING_SCORE = 13
export const BYE_SCORE = { winner: WINNING_SCORE, loser: 7 } as const
export const BYE_TEAM_ID = '**bye**'

export const FORMAT_LABELS: Record<ContestFormat, string> = {
  'tete-a-tete': 'Tête-à-tête',
  doublette: 'Doublette',
  triplette: 'Triplette',
}

export const MODE_LABELS: Record<ContestMode, string> = {
  'fixed-teams': 'Équipes fixes',
  'melee-demelee': 'Mêlée-démêlée',
}

export function getTeamSize(format: ContestFormat): 1 | 2 | 3 {
  const sizes = { 'tete-a-tete': 1, doublette: 2, triplette: 3 } as const
  return sizes[format]
}

export function getMinimumParticipants(format: ContestFormat, mode: ContestMode): number {
  return MIN_TEAMS * (mode === 'fixed-teams' ? 1 : getTeamSize(format))
}

export function isValidRoundCount(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_ROUNDS
}

export function assertRoundCount(value: number): void {
  if (!isValidRoundCount(value)) {
    throw new Error(`Le nombre de parties doit être un entier entre 1 et ${MAX_ROUNDS}.`)
  }
}

export function isScore(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= WINNING_SCORE
  )
}

export function isByeMatch(match: Pick<Match, 'teamB' | 'isBye'>): boolean {
  return match.isBye === true || match.teamB === null
}

export function isMatchComplete(match: Match): boolean {
  const { scoreA, scoreB } = match
  if (isByeMatch(match)) {
    return scoreA === BYE_SCORE.winner && scoreB === BYE_SCORE.loser
  }
  return (
    isScore(scoreA) &&
    isScore(scoreB) &&
    ((scoreA === WINNING_SCORE && scoreB < WINNING_SCORE) ||
      (scoreB === WINNING_SCORE && scoreA < WINNING_SCORE))
  )
}
