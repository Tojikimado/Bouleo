interface ScoreInputProps {
  value: number | null
  onChange: (value: number | null) => void
}

function ScoreInput({
  value,
  onChange,
}: ScoreInputProps) {
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

        onChange(Number(inputValue))
      }}
    />
  )
}

export default ScoreInput