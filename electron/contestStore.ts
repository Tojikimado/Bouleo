import fs from 'node:fs/promises'
import path from 'node:path'
import type { Contest } from '../src/types/contest'
import type { ContestList, ContestSummary, SavedContest } from '../src/types/storage'
import {
  assertContest,
  assertId,
  parseSavedContest,
} from '../src/utils/contestValidation'

export class ContestStore {
  private queues = new Map<string, Promise<unknown>>()
  constructor(private directory: string) {}

  private file(id: string): string {
    const target = path.resolve(this.directory, `${id}.json`)
    if (path.dirname(target) !== path.resolve(this.directory))
      throw new Error('Chemin de sauvegarde invalide.')
    return target
  }

  private enqueue<T>(id: string, work: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(id) ?? Promise.resolve()
    const task = previous.catch(() => {}).then(work)
    this.queues.set(id, task)
    const cleanup = () => {
      if (this.queues.get(id) === task) this.queues.delete(id)
    }
    void task.then(cleanup, cleanup)
    return task
  }

  async save(value: unknown): Promise<boolean> {
    assertContest(value)
    const target = this.file(value.id)
    const saved: SavedContest = {
      version: 1,
      savedAt: new Date().toISOString(),
      contest: value,
    }
    const json = JSON.stringify(saved, null, 2)
    return this.enqueue(value.id, async () => {
      await fs.mkdir(this.directory, { recursive: true })
      await fs.writeFile(`${target}.tmp`, json, 'utf8')
      await fs.rename(`${target}.tmp`, target)
      return true
    })
  }

  private read(id: unknown): Promise<SavedContest> {
    assertId(id)
    const target = this.file(id)
    return this.enqueue(id, async () =>
      parseSavedContest(await fs.readFile(target, 'utf8'), id),
    )
  }

  async load(id: unknown): Promise<Contest> {
    return (await this.read(id)).contest
  }

  async delete(id: unknown): Promise<boolean> {
    assertId(id)
    const target = this.file(id)
    return this.enqueue(id, async () => {
      await fs.unlink(target)
      return true
    })
  }

  async list(): Promise<ContestList> {
    await fs.mkdir(this.directory, { recursive: true })
    const entries = await fs.readdir(this.directory, { withFileTypes: true })
    const contests: ContestSummary[] = []
    const errors: string[] = []
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.json')) continue
      try {
        const id = entry.name.slice(0, -5)
        const { contest, savedAt } = await this.read(id)
        contests.push({
          id,
          name: contest.name,
          totalRounds: contest.totalRounds,
          format: contest.format,
          mode: contest.mode,
          savedAt,
        })
      } catch {
        errors.push(
          `Le fichier « ${entry.name} » est illisible ou incompatible. Il a été conservé.`,
        )
      }
    }
    return {
      contests: contests.sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
      errors,
    }
  }

  async flush(): Promise<void> {
    while (this.queues.size) await Promise.all([...this.queues.values()])
  }
}
