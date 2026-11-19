import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import type { SubmitResult } from '../hooks/useIdeas'
import './IdeaForm.css'

type IdeaFormProps = {
  label: string
  submitLabel: string
  initialText?: string
  disabled?: boolean
  onSubmit: (text: string) => SubmitResult
  onCancel?: () => void
}

function IdeaForm({
  label,
  submitLabel,
  initialText = '',
  disabled = false,
  onSubmit,
  onCancel,
}: IdeaFormProps) {
  const inputId = useId()
  const errorId = useId()
  const [text, setText] = useState(initialText)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = onSubmit(text)
    if (result.saved) {
      setText('')
      setError(null)
    } else {
      setError(result.error ?? null)
    }
  }

  return (
    <form className="idea-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        value={text}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          setText(event.target.value)
          setError(null)
        }}
      />
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="idea-form-actions">
        <button type="submit" disabled={disabled}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default IdeaForm
