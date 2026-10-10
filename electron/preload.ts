import { ipcRenderer, contextBridge } from 'electron'
import type { Contest } from '../src/types/contest'

contextBridge.exposeInMainWorld(
  'bouleo',
  {
    saveContest(contest: Contest) {
      return ipcRenderer.invoke(
        'save-contest',
        contest,
      )
    },

    listContests() {
      return ipcRenderer.invoke(
        'list-contests',
      )
    },

    loadContest(contestId: string) {
      return ipcRenderer.invoke(
        'load-contest',
        contestId,
      )
    },

    
    deleteContest(contestId: string) {
      return ipcRenderer.invoke(
        'delete-contest',
        contestId,
      )
    },
  },
)
