import { useState } from 'react'

import './NewContestPage.css'

import type { Contest, ContestFormat, ContestMode } from '../../types/contest'
import { isValidRoundCount, MAX_ROUNDS } from '../../utils/contestRules'

interface NewContestPageProps {
  contest: Pick<Contest, 'name' | 'totalRounds' | 'format' | 'mode'> | null
  onBack: () => void
  onContinue: (
    name: string,
    totalRounds: number,
    format: ContestFormat,
    mode: ContestMode,
  ) => void
}

function NewContestPage({ contest, onBack, onContinue }: NewContestPageProps) {
  const [name, setName] = useState(contest?.name ?? '')

  const [totalRounds, setTotalRounds] = useState(contest?.totalRounds ?? 4)

  const [format, setFormat] = useState<ContestFormat>(contest?.format ?? 'tete-a-tete')

  const [mode, setMode] = useState<ContestMode>(contest?.mode ?? 'fixed-teams')

  function handleContinue() {
    if (!name.trim() || !isValidRoundCount(totalRounds)) {
      return
    }

    onContinue(name.trim(), totalRounds, format, mode)
  }

  return (
    <main className="new-contest-page">
      <div className="new-contest-content">
        <button className="new-contest-back" onClick={onBack}>
          ← Retour
        </button>

        <h1>Nouveau concours</h1>
        <p className="new-contest-description">
          Choisissez le format et le déroulement de votre concours.
        </p>

        <div className="new-contest-form">
          <div className="new-contest-field">
            <label htmlFor="contest-name">Nom du concours</label>

            <input
              id="contest-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex. Concours 09/10/2026"
            />
          </div>

          <div className="new-contest-field">
            <label htmlFor="total-rounds">Parties</label>

            <input
              id="total-rounds"
              type="number"
              min="1"
              max={MAX_ROUNDS}
              step="1"
              value={totalRounds}
              onChange={(event) => {
                const value = Number(event.target.value)

                setTotalRounds(Number.isNaN(value) ? 1 : Math.max(1, value))
              }}
            />
          </div>

          {!isValidRoundCount(totalRounds) && (
            <p role="alert">
              Le nombre de parties doit être un entier entre 1 et {MAX_ROUNDS}.
            </p>
          )}
          <div className="new-contest-section">
            <h2>Format</h2>

            <div className="new-contest-options">
              <label
                className={`new-contest-option ${format === 'tete-a-tete' ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={format === 'tete-a-tete'}
                  onChange={() => setFormat('tete-a-tete')}
                />

                <span>Tête-à-tête</span>
              </label>

              <label
                className={`new-contest-option ${format === 'doublette' ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={format === 'doublette'}
                  onChange={() => setFormat('doublette')}
                />

                <span>Doublette</span>
              </label>

              <label
                className={`new-contest-option ${format === 'triplette' ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={format === 'triplette'}
                  onChange={() => setFormat('triplette')}
                />

                <span>Triplette</span>
              </label>
            </div>
          </div>

          <div className="new-contest-section">
            <h2>Composition des équipes</h2>

            <div className="new-contest-options mode-options">
              <label
                className={`new-contest-option ${mode === 'fixed-teams' ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'fixed-teams'}
                  onChange={() => setMode('fixed-teams')}
                />

                <span>
                  Équipes fixes
                  <small>Les mêmes partenaires tout au long du concours.</small>
                </span>
              </label>

              <label
                className={`new-contest-option ${mode === 'melee-demelee' ? 'is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'melee-demelee'}
                  onChange={() => setMode('melee-demelee')}
                />

                <span>
                  Mêlée-démêlée<small>De nouveaux partenaires à chaque partie.</small>
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="new-contest-actions">
          <span>Ensuite : les participants</span>
          <button
            className="new-contest-continue"
            onClick={handleContinue}
            disabled={!name.trim() || !isValidRoundCount(totalRounds)}
          >
            Continuer →
          </button>
        </div>
      </div>
    </main>
  )
}

export default NewContestPage
