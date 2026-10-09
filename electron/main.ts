import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

interface SavedContest {
  version: 1
  savedAt: string
  contest: import('../src/types/contest').Contest
}

interface ContestSummary {
  id: string
  name: string
  totalRounds: number
  format: import('../src/types/contest').ContestFormat
  mode: import('../src/types/contest').ContestMode
  savedAt: string
}

const contestsDirectory = path.join(
  app.getPath('userData'),
  'contests',
)

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    title: 'Bouleo',
    icon: path.join(
      process.env.VITE_PUBLIC,
      'images',
      'icon.ico',
    ),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.maximize()

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const saveQueues = new Map<
  string,
  Promise<void>
>()

ipcMain.handle(
  'save-contest',
  async (_event, contest) => {
    const previousSave =
      saveQueues.get(contest.id) ??
      Promise.resolve()

    const currentSave =
      previousSave
        .catch(() => {})
        .then(async () => {
          const savedContest: SavedContest = {
            version: 1,
            savedAt: new Date().toISOString(),
            contest,
          }

          await fs.mkdir(
            contestsDirectory,
            { recursive: true },
          )

          const filePath = path.join(
            contestsDirectory,
            `${contest.id}.json`,
          )

          const tempFilePath = `${filePath}.tmp`

          const json = JSON.stringify(
            savedContest,
            null,
            2,
          )

          await fs.writeFile(
            tempFilePath,
            json,
            'utf-8',
          )

          await fs.rename(
            tempFilePath,
            filePath,
          )
        })

    saveQueues.set(
      contest.id,
      currentSave,
    )

    try {
      await currentSave
      return true
    } finally {
      if (
        saveQueues.get(contest.id) ===
        currentSave
      ) {
        saveQueues.delete(contest.id)
      }
    }
  },
)

ipcMain.handle(
  'list-contests',
  async () => {
    await fs.mkdir(
      contestsDirectory,
      { recursive: true },
    )

    const files = await fs.readdir(
      contestsDirectory,
      { withFileTypes: true },
    )

    const contests: ContestSummary[] = []

    for (const file of files) {
      if (
        !file.isFile() ||
        !file.name.endsWith('.json')
      ) {
        continue
      }

      const filePath = path.join(
        contestsDirectory,
        file.name,
      )

      try {
        const content =
          await fs.readFile(
            filePath,
            'utf-8',
          )

        const savedContest =
          JSON.parse(content) as SavedContest

        contests.push({
          id: savedContest.contest.id,
          name: savedContest.contest.name,
          totalRounds: savedContest.contest.totalRounds,
          format: savedContest.contest.format,
          mode: savedContest.contest.mode,
          savedAt: savedContest.savedAt,
        })
      } catch (error) {
        console.error(
          `Impossible de lire le concours ${file.name}:`,
          error,
        )
      }
    }

    return contests
  },
)

ipcMain.handle(
  'load-contest',
  async (_event, contestId) => {
    const filePath = path.join(
      contestsDirectory,
      `${contestId}.json`,
    )

    const content =
      await fs.readFile(
        filePath,
        'utf-8',
      )

    const savedContest =
      JSON.parse(content) as SavedContest

    return savedContest.contest
  },
)

app.whenReady().then(createWindow)
