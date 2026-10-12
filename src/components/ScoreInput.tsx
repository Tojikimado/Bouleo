import { isScore } from '../utils/contestRules'

interface ScoreInputProps {
  value: number | null
  onChange: (value: number | null) => void
  label?: string
  invalid?: boolean
  describedBy?: string
  winner?: boolean
}

function ScoreInput({
  value,
  onChange,
  label,
  invalid,
  describedBy,
  winner,
}: ScoreInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={winner ? 'score-input score-winner' : 'score-input'}
      value={value === null ? '' : String(value)}
      onChange={(event) => {
        const inputValue = event.target.value

        if (inputValue === '') {
          onChange(null)
          return
        }

        if (!/^\d+$/.test(inputValue)) {
          return
        }

        const score = Number(inputValue)
        if (isScore(score)) {
          onChange(score)
        }
      }}
    />
  )
}

export default ScoreInput
