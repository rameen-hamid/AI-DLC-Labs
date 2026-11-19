import type { Idea } from '../types'
import './IdeaList.css'

type IdeaListProps = {
  ideas: Idea[]
  disabled?: boolean
  onEdit: (id: string) => void
  onDelete: (idea: Idea) => void
}

function IdeaList({ ideas, disabled = false, onEdit, onDelete }: IdeaListProps) {
  if (ideas.length === 0) {
    return <p className="empty-state">No ideas yet. Add your first one above.</p>
  }

  return (
    <ul className="idea-list">
      {ideas.map((idea) => (
        <li key={idea.id} className="idea-item">
          <span className="idea-text">{idea.text}</span>
          <span className="idea-actions">
            <button
              type="button"
              disabled={disabled}
              aria-label={`Edit idea: ${idea.text}`}
              onClick={() => onEdit(idea.id)}
            >
              Edit
            </button>
            <button
              type="button"
              disabled={disabled}
              aria-label={`Delete idea: ${idea.text}`}
              onClick={() => onDelete(idea)}
            >
              Delete
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default IdeaList
