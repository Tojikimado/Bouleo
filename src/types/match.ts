import type { Team } from './team'

export interface Match {
  id: string
  teamA: Team
  teamB: Team
  scoreA: number | null
  scoreB: number | null
}