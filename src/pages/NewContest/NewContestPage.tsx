import { useState } from 'react'

import './NewContestPage.css'

import type { Contest, ContestFormat, ContestMode } from '../../types/contest'

interface NewContestPageProps {
  contest: Contest | null
  onBack: () => void
  onContinue: (
    name: string,
    totalRounds: number,
    format: ContestFormat,
    mode: ContestMode,
  ) => void
}

function NewContestPage({
  contest,
  onBack,
  onContinue,
}: NewContestPageProps) {
  const [name, setName] = useState(
    contest?.name ?? '',
  )

  const [totalRounds, setTotalRounds] =
    useState(contest?.totalRounds ?? 4)

  const [format, setFormat] =
    useState<ContestFormat>(
      contest?.format ?? 'tete-a-tete',
    )

  const [mode, setMode] =
    useState<ContestMode>(
      contest?.mode ?? 'fixed-teams',
    )

  function handleContinue() {
    if (!name.trim()) {
      return
    }

    onContinue(
      name.trim(),
      totalRounds,
      format,
      mode,
    )
  }

    return (
    <main className="new-contest-page">
      <div className="new-contest-content">
        <button
          className="new-contest-back"
          onClick={onBack}
        >
          ← Retour
        </button>

        <h1>Nouveau concours</h1>

        <div className="new-contest-form">
          <div className="new-contest-field">
            <label htmlFor="contest-name">
              Nom du concours
            </label>

            <input
              id="contest-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ex. Concours 09/10/2026"
            />
          </div>

          <div className="new-contest-field">
            <label htmlFor="total-rounds">
              Nombre de parties
            </label>

            <input
              id="total-rounds"
              type="number"
              min="1"
              value={totalRounds}
              onChange={(event) => {
                const value = Number(
                  event.target.value,
                )

                setTotalRounds(
                  Number.isNaN(value)
                    ? 1
                    : Math.max(1, value),
                )
              }}
            />
          </div>

          <div className="new-contest-section">
            <h2>Format</h2>

            <div className="new-contest-options">
              <label className="new-contest-option">
                <input
                  type="radio"
                  name="format"
                  checked={
                    format === 'tete-a-tete'
                  }
                  onChange={() =>
                    setFormat('tete-a-tete')
                  }
                />

                <span>Tête-à-tête</span>
              </label>

              <label className="new-contest-option">
                <input
                  type="radio"
                  name="format"
                  checked={
                    format === 'doublette'
                  }
                  onChange={() =>
                    setFormat('doublette')
                  }
                />

                <span>Doublette</span>
              </label>

              <label className="new-contest-option">
                <input
                  type="radio"
                  name="format"
                  checked={
                    format === 'triplette'
                  }
                  onChange={() =>
                    setFormat('triplette')
                  }
                />

                <span>Triplette</span>
              </label>
            </div>
          </div>

          <div className="new-contest-section">
            <h2>Mode</h2>

            <div className="new-contest-options">
              <label className="new-contest-option">
                <input
                  type="radio"
                  name="mode"
                  checked={
                    mode === 'fixed-teams'
                  }
                  onChange={() =>
                    setMode('fixed-teams')
                  }
                />

                <span>Équipes fixes</span>
              </label>

              <label className="new-contest-option">
                <input
                  type="radio"
                  name="mode"
                  checked={
                    mode === 'melee-demelee'
                  }
                  onChange={() =>
                    setMode('melee-demelee')
                  }
                />

                <span>Mêlée-démêlée</span>
              </label>
            </div>
          </div>

          <button
            className="new-contest-continue"
            onClick={handleContinue}
            disabled={!name.trim()}
          >
            Continuer →
          </button>
        </div>
      </div>
    </main>
  )
}

export default NewContestPage