import { useEffect, useState } from 'react'

import type {
  Contest,
  ContestFormat,
  ContestMode,
} from '../../types/contest'

import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import './OpenContestPage.css'

interface ContestSummary {
  id: string
  name: string
  totalRounds: number
  format: ContestFormat
  mode: ContestMode
  savedAt: string
}

interface OpenContestPageProps {
  onBack: () => void
  onOpenContest: (contest: Contest) => void
}

function getFormatLabel(format: ContestFormat): string {
  switch (format) {
    case 'tete-a-tete':
      return 'Tête-à-tête'
    case 'doublette':
      return 'Doublette'
    case 'triplette':
      return 'Triplette'
  }
}

function getModeLabel(mode: ContestMode): string {
  switch (mode) {
    case 'fixed-teams':
      return 'Équipes fixes'
    case 'melee-demelee':
      return 'Mêlée-démêlée'
  }
}

function OpenContestPage({
  onBack,
  onOpenContest,
}: OpenContestPageProps) {
  const [contests, setContests] = useState<ContestSummary[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isManaging, setIsManaging] = useState(false)
  const [contestsToDelete, setContestsToDelete] =
    useState<ContestSummary[] | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    window.bouleo.listContests()
      .then(setContests)
      .catch((error) => {
        console.error('Impossible de charger les concours :', error)
      })
  }, [])

  const allSelected =
    contests.length > 0 &&
    contests.every((contest) => selectedIds.includes(contest.id))

  function handleToggleSelection(contestId: string) {
    setSelectedIds((current) =>
      current.includes(contestId)
        ? current.filter((id) => id !== contestId)
        : [...current, contestId],
    )
  }

  function handleToggleSelectAll() {
    setSelectedIds(
      allSelected ? [] : contests.map((contest) => contest.id),
    )
  }

  function handleToggleManagement() {
    if (isManaging) {
      setSelectedIds([])
    }

    setIsManaging((current) => !current)
  }

  function handleOpenDeleteConfirmation(
    targets: ContestSummary[],
  ) {
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
      const results = await Promise.allSettled(
        contestsToDelete.map((contest) =>
          window.bouleo.deleteContest(contest.id),
        ),
      )

      const deletedIds = new Set<string>()
      const failedContests: ContestSummary[] = []

      results.forEach((result, index) => {
        const contest = contestsToDelete[index]

        if (result.status === 'fulfilled') {
          deletedIds.add(contest.id)
        } else {
          failedContests.push(contest)
          console.error(
            `Impossible de supprimer le concours ${contest.name} :`,
            result.reason,
          )
        }
      })

      if (deletedIds.size > 0) {
        setContests((current) =>
          current.filter((contest) => !deletedIds.has(contest.id)),
        )

        setSelectedIds((current) =>
          current.filter((id) => !deletedIds.has(id)),
        )
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

  const deleteMessage = contestsToDelete
    ? contestsToDelete.length === 1
      ? `Le concours « ${contestsToDelete[0].name} » et ses scores seront définitivement supprimés. Cette action est irréversible.`
      : `${contestsToDelete.length} concours et leurs scores seront définitivement supprimés. Cette action est irréversible.`
    : ''

  return (
    <main className="open-contest-page">
      <div className="open-contest-content">
        <button
          className="open-contest-back"
          type="button"
          onClick={onBack}
        >
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

        {contests.length === 0 ? (
          <div className="open-contest-empty">
            <p>Aucun concours sauvegardé.</p>
          </div>
        ) : (
          <>
            {isManaging && (
              <div className="open-contest-selection-toolbar">
                <button
                  className="open-contest-select-all"
                  type="button"
                  onClick={handleToggleSelectAll}
                >
                  {allSelected
                    ? 'Tout désélectionner'
                    : 'Tout sélectionner'}
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
                      contests.filter((contest) =>
                        selectedIds.includes(contest.id),
                      ),
                    )
                  }
                >
                  Supprimer la sélection ({selectedIds.length})
                </button>
              </div>
            )}

            <div className={`open-contest-list${contests.length >= 5 ? ' is-scrollable' : ''}`}>
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
                          onChange={() =>
                            handleToggleSelection(contest.id)
                          }
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
                        {getFormatLabel(contest.format)}
                        {' · '}
                        {getModeLabel(contest.mode)}
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
                        onClick={async () => {
                          try {
                            const loadedContest =
                              await window.bouleo.loadContest(contest.id)

                            onOpenContest(loadedContest)
                          } catch (error) {
                            console.error(
                              'Impossible d’ouvrir le concours :',
                              error,
                            )
                          }
                        }}
                      >
                        Ouvrir →
                      </button>

                      {isManaging && (
                        <button
                          className="open-contest-delete"
                          type="button"
                          aria-label={`Supprimer le concours ${contest.name}`}
                          title="Supprimer ce concours"
                          onClick={() =>
                            handleOpenDeleteConfirmation([contest])
                          }
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
        message={`${deleteError ? `${deleteError} ` : ''}${deleteMessage}`}
        confirmLabel={isDeleting ? 'Suppression…' : 'Supprimer'}
        cancelLabel="Annuler"
        onConfirm={handleDeleteContests}
        onCancel={handleCancelDelete}
      />
    </main>
  )
}

export default OpenContestPage