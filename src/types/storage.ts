import type { Contest } from './contest'

export interface SavedContest {
  version: 1
  savedAt: string
  contest: Contest
}

export type ContestSummary = Pick<
  Contest,
  'id' | 'name' | 'totalRounds' | 'format' | 'mode'
> & {
  savedAt: string
}

export interface ContestList {
  contests: ContestSummary[]
  errors: string[]
}

export interface BouleoApi {
  saveContest(contest: Contest): Promise<boolean>
  listContests(): Promise<ContestList>
  loadContest(id: string): Promise<Contest>
  deleteContest(id: string): Promise<boolean>
  onPrepareClose(callback: (token: string) => void): () => void
  finishClose(token: string, success: boolean): void
}
