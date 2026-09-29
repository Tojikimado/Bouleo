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
      value={value === null ? '' : String(value)}
      onChange={(event) => {
        onChange(
          event.target.value === ''
            ? null
            : Number(event.target.value),
        )
      }}
    />
  )
}

export default ScoreInput