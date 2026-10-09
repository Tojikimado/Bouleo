/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

interface Window {
  bouleo: {
    saveContest(
      contest: import('../src/types/contest').Contest,
    ): Promise<boolean>

    listContests(): Promise<
      {
        id: string
        name: string
        totalRounds: number
        format: import('../src/types/contest').ContestFormat
        mode: import('../src/types/contest').ContestMode
        savedAt: string
      }[]
    >

    loadContest(
      contestId: string,
    ): Promise<
      import('../src/types/contest').Contest
    >
  }
}