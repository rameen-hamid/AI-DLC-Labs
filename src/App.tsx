import { useState } from 'react'
import IdeaForm from './components/IdeaForm'
import IdeaList from './components/IdeaList'
import { useIdeas } from './hooks/useIdeas'
import type { Idea } from './types'
import './App.css'

function App() {
  const {
    ideas,
    blocked,
    notice,
    saveError,
    addIdea,
    editIdea,
    deleteIdea,
    clearIdeas,
  } = useIdeas()
  // Held in memory only, so a reload always returns to the list.
  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = ideas.find((idea) => idea.id === editingId)

  function handleDelete(idea: Idea) {
    if (window.confirm(`Delete this idea?\n\n${idea.text}`)) {
      deleteIdea(idea.id)
    }
  }

  function handleClearAll() {
    if (
      window.confirm(
        `Delete all ${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}? This cannot be undone.`,
      )
    ) {
      clearIdeas()
    }
  }

  return (
    <main className="app">
      <h1>Idea Board</h1>

      {notice && (
        <p className="banner" role="alert">
          {notice}
        </p>
      )}
      {saveError && (
        <p className="banner" role="alert">
          {saveError}
        </p>
      )}

      {editing ? (
        <IdeaForm
          key={editing.id}
          label="Edit idea"
          submitLabel="Save"
          initialText={editing.text}
          disabled={blocked}
          onSubmit={(text) => {
            const result = editIdea(editing.id, text)
            if (result.saved) setEditingId(null)
            return result
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <>
          <IdeaForm
            label="New idea"
            submitLabel="Add idea"
            disabled={blocked}
            onSubmit={addIdea}
          />
          <div className="list-toolbar">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={blocked || ideas.length === 0}
            >
              Clear all
            </button>
          </div>
          <IdeaList
            ideas={ideas}
            disabled={blocked}
            onEdit={setEditingId}
            onDelete={handleDelete}
          />
        </>
      )}
    </main>
  )
}

export default App
