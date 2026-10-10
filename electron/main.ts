import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { ContestStore } from './contestStore'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appRoot = path.join(__dirname, '..')
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const rendererDirectory = path.join(appRoot, 'dist')
const publicDirectory = devServerUrl ? path.join(appRoot, 'public') : rendererDirectory

const store = new ContestStore(path.join(app.getPath('userData'), 'contests'))
let win: BrowserWindow | null = null
let closeAllowed = false
let rendererReady = false
let closeToken: string | null = null
let closeTimer: ReturnType<typeof setTimeout> | undefined

async function closeFailed(message: string) {
  if (!win || win.isDestroyed()) return
  if (closeTimer) clearTimeout(closeTimer)
  closeToken = null
  win.setEnabled(true)
  const result = await dialog.showMessageBox(win, {
    type: 'warning',
    title: 'Sauvegarde de Bouleo',
    message,
    detail:
      'Vous pouvez rester dans Bouleo et réessayer. Quitter maintenant peut perdre les dernières modifications.',
    buttons: ['Rester dans Bouleo', 'Quitter sans enregistrer'],
    defaultId: 0,
    cancelId: 0,
  })
  if (result.response === 1) {
    closeAllowed = true
    win.close()
  }
}

function createWindow() {
  win = new BrowserWindow({
    title: 'Bouleo',
    icon: path.join(publicDirectory, 'images', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  win.maximize()
  win.on('close', (event) => {
    if (closeAllowed) return
    event.preventDefault()
    if (closeToken) return
    if (!rendererReady || win!.webContents.isCrashed()) {
      void closeFailed('L’interface ne peut pas confirmer la sauvegarde.')
      return
    }
    closeToken = randomUUID()
    win!.setEnabled(false)
    win!.webContents.send('prepare-close', closeToken)
    closeTimer = setTimeout(() => {
      void closeFailed('La sauvegarde ne répond pas.')
    }, 30000)
  })
  win.on('closed', () => {
    win = null
    rendererReady = false
  })
  if (devServerUrl) void win.loadURL(devServerUrl)
  else void win.loadFile(path.join(rendererDirectory, 'index.html'))
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  })
  app.on('before-quit', (event) => {
    if (win && !closeAllowed) {
      event.preventDefault()
      win.close()
    }
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  app.on('activate', () => {
    if (!win) {
      closeAllowed = false
      createWindow()
    }
  })

  ipcMain.on('renderer-ready', (event) => {
    if (event.sender === win?.webContents) rendererReady = true
  })
  ipcMain.on('finish-close', async (event, token: unknown, success: unknown) => {
    if (event.sender !== win?.webContents || token !== closeToken || !closeToken) return
    if (closeTimer) clearTimeout(closeTimer)
    try {
      if (success !== true) throw new Error('Des modifications ne sont pas enregistrées.')
      await store.flush()
      closeAllowed = true
      win?.close()
    } catch {
      await closeFailed('Impossible d’enregistrer toutes les modifications.')
    }
  })
  ipcMain.handle('save-contest', (event, contest: unknown) => {
    if (event.sender !== win?.webContents) throw new Error('Fenêtre non autorisée.')
    return store.save(contest)
  })
  ipcMain.handle('load-contest', (event, id: unknown) => {
    if (event.sender !== win?.webContents) throw new Error('Fenêtre non autorisée.')
    return store.load(id)
  })
  ipcMain.handle('delete-contest', (event, id: unknown) => {
    if (event.sender !== win?.webContents) throw new Error('Fenêtre non autorisée.')
    return store.delete(id)
  })
  ipcMain.handle('list-contests', (event) => {
    if (event.sender !== win?.webContents) throw new Error('Fenêtre non autorisée.')
    return store.list()
  })
  void app.whenReady().then(createWindow)
}
