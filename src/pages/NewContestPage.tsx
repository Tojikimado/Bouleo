import { useState } from 'react'

import type {
  ContestFormat,
  ContestMode,
} from '../types/contest'

interface NewContestPageProps {
  onBack: () => void
  onContinue: (
    name: string,
    totalRounds: number,
    format: ContestFormat,
    mode: ContestMode,
  ) => void
}

function NewContestPage({
  onBack,
  onContinue,
}: NewContestPageProps) {
  const [name, setName] = useState('')
  const [totalRounds, setTotalRounds] = useState(6)

  const [format, setFormat] =
    useState<ContestFormat>('tete-a-tete')

  const [mode, setMode] =
    useState<ContestMode>('fixed-teams')

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
    <main>
      <button onClick={onBack}>
        ← Retour
      </button>

      <h1>Nouveau concours</h1>

      <div>
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
          placeholder="Ex. Concours du samedi"
        />
      </div>

      <div>
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

      <div>
        <h2>Format</h2>

        <label>
          <input
            type="radio"
            name="format"
            checked={format === 'tete-a-tete'}
            onChange={() =>
              setFormat('tete-a-tete')
            }
          />

          Tête-à-tête
        </label>

        <label>
          <input
            type="radio"
            name="format"
            checked={format === 'doublette'}
            onChange={() =>
              setFormat('doublette')
            }
          />

          Doublette
        </label>

        <label>
          <input
            type="radio"
            name="format"
            checked={format === 'triplette'}
            onChange={() =>
              setFormat('triplette')
            }
          />

          Triplette
        </label>
      </div>

      <div>
        <h2>Mode</h2>

        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === 'fixed-teams'}
            onChange={() =>
              setMode('fixed-teams')
            }
          />

          Équipes fixes
        </label>

        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === 'melee-demelee'}
            onChange={() =>
              setMode('melee-demelee')
            }
          />

          Mêlée-démêlée
        </label>
      </div>

      <button
        onClick={handleContinue}
        disabled={!name.trim()}
      >
        Continuer →
      </button>
    </main>
  )
}

export default NewContestPage