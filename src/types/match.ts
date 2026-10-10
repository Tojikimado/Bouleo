import type { Team } from './team'

export interface Match {
  id: string
  teamA: Team
  teamB: Team | null
  scoreA: number | null
  scoreB: number | null
  isBye?: boolean
}
