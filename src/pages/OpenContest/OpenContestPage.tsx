import { useEffect, useState } from 'react'

import type { Contest } from '../../types/contest'
import type { ContestSummary } from '../../types/storage'
import { FORMAT_LABELS, MODE_LABELS } from '../../utils/contestRules'

import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import './OpenContestPage.css'

interface OpenContestPageProps {
  onBack: () => void
  onOpenContest: (contest: Contest) => void
}

function OpenContestPage({ onBack, onOpenContest }: OpenContestPageProps) {
  const [contests, setContests] = useState<ContestSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isManaging, setIsManaging] = useState(false)
  const [contestsToDelete, setContestsToDelete] = useState<ContestSummary[] | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  async function reload() {
    setIsLoading(true)
    setLoadError('')
    try {
      const result = await window.bouleo.listContests()
      setContests(result.contests)
      setWarnings(result.errors)
    } catch {
      setLoadError(
        'Impossible de lire les concours sauvegardés. Vérifiez l’accès au dossier puis réessayez.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const allSelected =
    contests.length > 0 && contests.every((contest) => selectedIds.includes(contest.id))

  function handleToggleSelection(contestId: string) {
    setSelectedIds((current) =>
      current.includes(contestId)
        ? current.filter((id) => id !== contestId)
        : [...current, contestId],
    )
  }

  function handleToggleSelectAll() {
    setSelectedIds(allSelected ? [] : contests.map((contest) => contest.id))
  }

  function handleToggleManagement() {
    if (isManaging) {
      setSelectedIds([])
    }

    setIsManaging((current) => !current)
  }

  function handleOpenDeleteConfirmation(targets: ContestSummary[]) {
    if (targets.length === 0) {
      return
    }

    setDeleteError('')
    setContestsToDelete(targets)
  }

  async function handleDeleteContests() {
    if (!contestsToDelete || isDeleting) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      const deletedIds = new Set<string>()
      const failedContests: ContestSummary[] = []
      // Un fichier inaccessible ne doit pas empêcher de traiter les suivants.
      for (const contest of contestsToDelete) {
        try {
          await window.bouleo.deleteContest(contest.id)
          deletedIds.add(contest.id)
        } catch (error) {
          failedContests.push(contest)
          console.error(`Impossible de supprimer le concours ${contest.name} :`, error)
        }
      }

      if (deletedIds.size > 0) {
        setContests((current) => current.filter((contest) => !deletedIds.has(contest.id)))

        setSelectedIds((current) => current.filter((id) => !deletedIds.has(id)))
      }

      if (failedContests.length > 0) {
        setContestsToDelete(failedContests)
        setDeleteError(
          `${deletedIds.size} concours supprimé(s). ` +
            `${failedContests.length} suppression(s) ont échoué. ` +
            'Les concours restants sont conservés et peuvent être réessayés.',
        )
      } else {
        setContestsToDelete(null)

        if (deletedIds.size === contests.length) {
          setIsManaging(false)
          setSelectedIds([])
        }
      }
    } finally {
      setIsDeleting(false)
    }
  }

  function handleCancelDelete() {
    if (isDeleting) {
      return
    }

    setContestsToDelete(null)
    setDeleteError('')
  }

  async function handleOpenContest(id: string) {
    setLoadError('')
    try {
      const loadedContest = await window.bouleo.loadContest(id)
      onOpenContest(loadedContest)
    } catch (error) {
      setLoadError(
        'Impossible d’ouvrir ce concours : sa sauvegarde est inaccessible ou incompatible.',
      )
      console.error('Impossible d’ouvrir le concours :', error)
    }
  }

  let deleteMessage = ''
  if (contestsToDelete?.length === 1) {
    deleteMessage = `Le concours « ${contestsToDelete[0].name} » et ses scores seront définitivement supprimés. Cette action est irréversible.`
  } else if (contestsToDelete) {
    deleteMessage = `${contestsToDelete.length} concours et leurs scores seront définitivement supprimés. Cette action est irréversible.`
  }
  const confirmationMessage = [deleteError, deleteMessage].filter(Boolean).join(' ')

  return (
    <main className="open-contest-page">
      <div className="open-contest-content">
        <button className="open-contest-back" type="button" onClick={onBack}>
          ← Retour à l'accueil
        </button>

        <header className="open-contest-header-row">
          <div className="open-contest-header">
            <h1>Ouvrir un concours</h1>
            <p>Sélectionnez un concours sauvegardé.</p>
          </div>

          {contests.length > 0 && (
            <button
              className="open-contest-manage-toggle"
              type="button"
              onClick={handleToggleManagement}
            >
              {isManaging ? 'Terminer' : 'Gérer les concours'}
            </button>
          )}
        </header>

        {loadError && (
          <p role="alert">
            {loadError} <button onClick={reload}>Réessayer</button>
          </p>
        )}
        {warnings.map((warning) => (
          <p role="alert" key={warning}>
            {warning}
          </p>
        ))}
        {isLoading && <p role="status">Chargement…</p>}
        {!isLoading && contests.length === 0 && (
          <div className="open-contest-empty">
            {!loadError && (
              <p>
                {warnings.length
                  ? 'Aucun concours lisible.'
                  : 'Aucun concours sauvegardé.'}
              </p>
            )}
          </div>
        )}
        {!isLoading && contests.length > 0 && (
          <>
            {isManaging && (
              <div className="open-contest-selection-toolbar">
                <button
                  className="open-contest-select-all"
                  type="button"
                  onClick={handleToggleSelectAll}
                >
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>

                <span className="open-contest-selection-count">
                  {selectedIds.length} sélectionné
                  {selectedIds.length > 1 ? 's' : ''}
                </span>

                <button
                  className="open-contest-delete-selected"
                  type="button"
                  disabled={selectedIds.length === 0}
                  onClick={() =>
                    handleOpenDeleteConfirmation(
                      contests.filter((contest) => selectedIds.includes(contest.id)),
                    )
                  }
                >
                  Supprimer la sélection ({selectedIds.length})
                </button>
              </div>
            )}

            <div className="open-contest-list">
              {contests.map((contest) => {
                const isSelected = selectedIds.includes(contest.id)

                return (
                  <article
                    className={`open-contest-card${isManaging && isSelected ? ' is-selected' : ''}`}
                    key={contest.id}
                  >
                    {isManaging && (
                      <label className="open-contest-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelection(contest.id)}
                          aria-label={`Sélectionner le concours ${contest.name}`}
                        />
                      </label>
                    )}

                    <div className="open-contest-card-content">
                      <h2>{contest.name}</h2>

                      <p className="open-contest-details">
                        {contest.totalRounds} partie
                        {contest.totalRounds > 1 ? 's' : ''}
                        {' · '}
                        {FORMAT_LABELS[contest.format]}
                        {' · '}
                        {MODE_LABELS[contest.mode]}
                      </p>

                      <p className="open-contest-date">
                        Dernière sauvegarde :{' '}
                        {new Date(contest.savedAt).toLocaleString('fr-FR')}
                      </p>
                    </div>

                    <div className="open-contest-card-actions">
                      <button
                        className="open-contest-button"
                        type="button"
                        onClick={() => handleOpenContest(contest.id)}
                      >
                        Ouvrir →
                      </button>

                      {isManaging && (
                        <button
                          className="open-contest-delete"
                          type="button"
                          aria-label={`Supprimer le concours ${contest.name}`}
                          title="Supprimer ce concours"
                          onClick={() => handleOpenDeleteConfirmation([contest])}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            width="19"
                            height="19"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="m19 6-1 14H6L5 6" />
                            <path d="M10 11v5M14 11v5" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={contestsToDelete !== null}
        title={
          contestsToDelete && contestsToDelete.length > 1
            ? `Supprimer ${contestsToDelete.length} concours ?`
            : 'Supprimer ce concours ?'
        }
        message={confirmationMessage}
        confirmLabel={isDeleting ? 'Suppression…' : 'Supprimer'}
        cancelLabel="Annuler"
        onConfirm={handleDeleteContests}
        onCancel={handleCancelDelete}
      />
    </main>
  )
}

export default OpenContestPage
