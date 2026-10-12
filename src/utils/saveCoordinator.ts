import type { Contest } from '../types/contest'

export type SaveStatus = 'saving' | 'saved' | 'error'

// Garder chaque concours non enregistré, même après un retour à l'accueil.
export class SaveCoordinator {
  // Une seule version à conserver par concours : la plus récente, pas encore écrite.
  private dirty = new Map<string, Contest>()
  // Les opérations déjà lancées doivent se terminer avant la fermeture.
  private pending = new Set<Promise<void>>()
  private failedIds = new Set<string>()
  onChange: () => void = () => {}

  constructor(private write: (contest: Contest) => Promise<unknown>) {}

  get status(): SaveStatus {
    if (this.failedIds.size) {
      return 'error'
    }
    return this.pending.size ? 'saving' : 'saved'
  }

  get failed(): boolean {
    return this.failedIds.size > 0
  }

  save(contest: Contest): void {
    this.dirty.set(contest.id, contest)
    const operation = this.writeSnapshot(contest).finally(() => {
      this.pending.delete(operation)
      this.onChange()
    })
    this.pending.add(operation)
    this.onChange()
  }

  private async writeSnapshot(contest: Contest): Promise<void> {
    try {
      await this.write(contest)
      // Une ancienne sauvegarde terminée ne doit pas effacer une modification récente.
      if (this.dirty.get(contest.id) === contest) {
        this.dirty.delete(contest.id)
        this.failedIds.delete(contest.id)
      }
    } catch {
      if (this.dirty.get(contest.id) === contest) {
        this.failedIds.add(contest.id)
      }
    }
  }

  async flush(): Promise<void> {
    // Attendre les écritures en cours, puis retenter les versions restées en mémoire.
    while (this.pending.size) {
      await Promise.all([...this.pending])
    }
    for (const contest of this.dirty.values()) {
      this.save(contest)
    }
    while (this.pending.size) {
      await Promise.all([...this.pending])
    }
    if (this.dirty.size) {
      throw new Error(
        'Des modifications ne sont pas enregistrées. Réessayez avant de fermer.',
      )
    }
  }
}
