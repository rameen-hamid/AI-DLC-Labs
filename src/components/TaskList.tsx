import type { Task, Priority, Status } from '../types'
import TaskItem from './TaskItem'
import './TaskList.css'

type TaskListProps = {
  tasks: Task[] // already sorted by the caller
  disabled?: boolean
  onClearAll: () => void
  onConvertToIdea: (task: Task) => void
  onEdit: (id: string) => void
  onSetPriority: (id: string, priority: Priority) => void
  onSetStatus: (id: string, status: Status) => void
  onDelete: (task: Task) => void
}

function TaskList({
  tasks,
  disabled = false,
  onClearAll,
  onConvertToIdea,
  onEdit,
  onSetPriority,
  onSetStatus,
  onDelete,
}: TaskListProps) {
  return (
    <section className="task-list-section">
      <div className="task-list-header">
        <h2>Tasks</h2>
        <button
          type="button"
          onClick={onClearAll}
          disabled={disabled || tasks.length === 0}
        >
          Clear all tasks
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="empty-state">No tasks yet. Convert an idea to get started.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              disabled={disabled}
              onConvertToIdea={onConvertToIdea}
              onEdit={onEdit}
              onSetPriority={onSetPriority}
              onSetStatus={onSetStatus}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default TaskList
