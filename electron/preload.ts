import { contextBridge, ipcRenderer } from 'electron'
import type { BouleoApi } from '../src/types/storage'

const api: BouleoApi = {
  saveContest: (contest) => ipcRenderer.invoke('save-contest', contest),
  listContests: () => ipcRenderer.invoke('list-contests'),
  loadContest: (id) => ipcRenderer.invoke('load-contest', id),
  deleteContest: (id) => ipcRenderer.invoke('delete-contest', id),

  onPrepareClose(callback) {
    const listener = (_event: Electron.IpcRendererEvent, token: string) => callback(token)
    ipcRenderer.on('prepare-close', listener)
    ipcRenderer.send('renderer-ready')
    return () => ipcRenderer.removeListener('prepare-close', listener)
  },
  finishClose: (token, success) => ipcRenderer.send('finish-close', token, success),
}

contextBridge.exposeInMainWorld('bouleo', api)
