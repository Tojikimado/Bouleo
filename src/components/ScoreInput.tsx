import { isScore } from '../utils/contestRules'

interface ScoreInputProps {
  value: number | null
  onChange: (value: number | null) => void
}

function ScoreInput({ value, onChange }: ScoreInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
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
        if (isScore(score)) onChange(score)
      }}
    />
  )
}

export default ScoreInput
