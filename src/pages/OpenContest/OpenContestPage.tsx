import { useEffect, useState } from 'react'

import type {
  ContestFormat,
  ContestMode,
} from '../../types/contest'

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
  onOpenContest: (
    contest: import('../../types/contest').Contest,
  ) => void
}

function getFormatLabel(
  format: ContestFormat,
): string {
  switch (format) {
    case 'tete-a-tete':
      return 'Tête-à-tête'

    case 'doublette':
      return 'Doublette'

    case 'triplette':
      return 'Triplette'
  }
}

function getModeLabel(
  mode: ContestMode,
): string {
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
  const [contests, setContests] =
    useState<ContestSummary[]>([])

  useEffect(() => {
    window.bouleo.listContests().then(
      (savedContests) => {
        setContests(savedContests)
      },
    )
  }, [])

  return (
    <main className="open-contest-page">
      <div className="open-contest-content">
        <button
          className="open-contest-back"
          onClick={onBack}
        >
          ← Retour à l'accueil
        </button>

        <header className="open-contest-header">
          <h1>Ouvrir un concours</h1>

          <p>
            Sélectionnez un concours sauvegardé.
          </p>
        </header>

        {contests.length === 0 ? (
          <div className="open-contest-empty">
            <p>
              Aucun concours sauvegardé.
            </p>
          </div>
        ) : (
          <div className="open-contest-list">
            {contests.map((contest) => (
              <article
                className="open-contest-card"
                key={contest.id}
              >
                <div className="open-contest-card-content">
                  <h2>{contest.name}</h2>

                  <p className="open-contest-details">
                    {contest.totalRounds} partie
                    {contest.totalRounds > 1
                      ? 's'
                      : ''}
                    {' · '}
                    {getFormatLabel(
                      contest.format,
                    )}
                    {' · '}
                    {getModeLabel(
                      contest.mode,
                    )}
                  </p>

                  <p className="open-contest-date">
                    Dernière sauvegarde :{' '}
                    {new Date(
                      contest.savedAt,
                    ).toLocaleString('fr-FR')}
                  </p>
                </div>

                <button
                  className="open-contest-button"
                  onClick={async () => {
                    const loadedContest =
                      await window.bouleo.loadContest(
                        contest.id,
                      )

                    onOpenContest(
                      loadedContest,
                    )
                  }}
                >
                  Ouvrir →
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default OpenContestPage