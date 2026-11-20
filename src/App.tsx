import { useState } from 'react'
import IdeaForm from './components/IdeaForm'
import IdeaList from './components/IdeaList'
import TaskList from './components/TaskList'
import { useBoard } from './hooks/useBoard'
import type { Idea, Task } from './types'
import './App.css'

function App() {
  const {
    ideas,
    sortedTasks,
    blocked,
    ideaBlocked,
    taskBlocked,
    notice,
    saveError,
    addIdea,
    editIdea,
    deleteIdea,
    clearIdeas,
    convertIdeaToTask,
    convertTaskToIdea,
    editTask,
    setPriority,
    setStatus,
    deleteTask,
    clearTasks,
  } = useBoard()

  // Held in memory only, so a reload always returns to the list.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const editing = ideas.find((idea) => idea.id === editingId)
  const editingTask = sortedTasks.find((task) => task.id === editingTaskId)

  function handleDeleteIdea(idea: Idea) {
    if (window.confirm(`Delete this idea?\n\n${idea.text}`)) {
      deleteIdea(idea.id)
    }
  }

  function handleClearIdeas() {
    if (
      window.confirm(
        `Delete all ${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}? This cannot be undone.`,
      )
    ) {
      clearIdeas()
    }
  }

  function handleConvertIdeaToTask(idea: Idea) {
    convertIdeaToTask(idea.id)
  }

  function handleDeleteTask(task: Task) {
    if (window.confirm(`Delete this task?\n\n${task.text}`)) {
      deleteTask(task.id)
    }
  }

  function handleClearTasks() {
    if (
      window.confirm(
        `Delete all ${sortedTasks.length} ${sortedTasks.length === 1 ? 'task' : 'tasks'}? This cannot be undone.`,
      )
    ) {
      clearTasks()
    }
  }

  function handleConvertTaskToIdea(task: Task) {
    convertTaskToIdea(task.id)
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
          disabled={ideaBlocked}
          onSubmit={(text) => {
            const result = editIdea(editing.id, text)
            if (result.saved) setEditingId(null)
            return result
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : editingTask ? (
        <IdeaForm
          key={editingTask.id}
          label="Edit task"
          submitLabel="Save"
          initialText={editingTask.text}
          disabled={taskBlocked}
          onSubmit={(text) => {
            const result = editTask(editingTask.id, text)
            if (result.saved) setEditingTaskId(null)
            return result
          }}
          onCancel={() => setEditingTaskId(null)}
        />
      ) : (
        <>
          <IdeaForm
            label="New idea"
            submitLabel="Add idea"
            disabled={ideaBlocked}
            onSubmit={addIdea}
          />
          <div className="list-toolbar">
            <button
              type="button"
              onClick={handleClearIdeas}
              disabled={blocked || ideas.length === 0}
            >
              Clear all
            </button>
          </div>
          <IdeaList
            ideas={ideas}
            disabled={blocked}
            onConvertToTask={handleConvertIdeaToTask}
            onEdit={setEditingId}
            onDelete={handleDeleteIdea}
          />
          <TaskList
            tasks={sortedTasks}
            disabled={blocked}
            onClearAll={handleClearTasks}
            onConvertToIdea={handleConvertTaskToIdea}
            onEdit={setEditingTaskId}
            onSetPriority={setPriority}
            onSetStatus={setStatus}
            onDelete={handleDeleteTask}
          />
        </>
      )}
    </main>
  )
}

export default App
