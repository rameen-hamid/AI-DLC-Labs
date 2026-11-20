import { useId } from 'react'
import type { Task, Priority, Status } from '../types'
import { PRIORITIES, STATUSES, PRIORITY_LABELS, STATUS_LABELS } from '../taskRules'
import './TaskItem.css'

type TaskItemProps = {
  task: Task
  disabled?: boolean
  onConvertToIdea: (task: Task) => void
  onEdit: (id: string) => void
  onSetPriority: (id: string, priority: Priority) => void
  onSetStatus: (id: string, status: Status) => void
  onDelete: (task: Task) => void
}

function TaskItem({
  task,
  disabled = false,
  onConvertToIdea,
  onEdit,
  onSetPriority,
  onSetStatus,
  onDelete,
}: TaskItemProps) {
  const priorityLabelId = useId()
  const statusLabelId = useId()

  return (
    <li className="task-item">
      <span
        className={`task-text${task.status === 'completed' ? ' task-completed' : ''}`}
      >
        {task.text}
      </span>

      <div className="task-controls">
        <div className="task-select-group">
          <label id={priorityLabelId} className="visually-hidden">
            Priority for: {task.text}
          </label>
          <select
            aria-labelledby={priorityLabelId}
            value={task.priority}
            disabled={disabled}
            onChange={(e) => onSetPriority(task.id, e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="task-select-group">
          <label id={statusLabelId} className="visually-hidden">
            Status for: {task.text}
          </label>
          <select
            aria-labelledby={statusLabelId}
            value={task.status}
            disabled={disabled}
            onChange={(e) => onSetStatus(task.id, e.target.value as Status)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="task-actions">
          <button
            type="button"
            disabled={disabled}
            aria-label={`Convert task to idea: ${task.text}`}
            onClick={() => onConvertToIdea(task)}
          >
            To idea
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Edit task: ${task.text}`}
            onClick={() => onEdit(task.id)}
          >
            Edit
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-label={`Delete task: ${task.text}`}
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}

export default TaskItem
