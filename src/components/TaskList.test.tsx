import { render, screen } from '@testing-library/react'
import type { Task } from '../types'
import TaskList from './TaskList'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    text: 'A task',
    priority: 'medium',
    status: 'todo',
    createdAt: 1000,
    ...overrides,
  }
}

const noop = () => {}

function renderList(tasks: Task[]) {
  return render(
    <TaskList
      tasks={tasks}
      onClearAll={noop}
      onConvertToIdea={noop}
      onEdit={noop}
      onSetPriority={noop}
      onSetStatus={noop}
      onDelete={noop}
    />,
  )
}

describe('TaskList', () => {
  it('shows empty-state message when there are no tasks (Req 11.4)', () => {
    renderList([])
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument()
  })

  it('does not show empty-state message when tasks are present', () => {
    renderList([makeTask()])
    expect(screen.queryByText(/No tasks yet/i)).not.toBeInTheDocument()
  })

  it('renders one row per task', () => {
    renderList([
      makeTask({ id: '1', text: 'Task one' }),
      makeTask({ id: '2', text: 'Task two' }),
    ])
    expect(screen.getByText('Task one')).toBeInTheDocument()
    expect(screen.getByText('Task two')).toBeInTheDocument()
  })

  it('clear-all button is disabled when task list is empty (Req 10.2)', () => {
    renderList([])
    expect(screen.getByRole('button', { name: /Clear all tasks/i })).toBeDisabled()
  })

  it('clear-all button is enabled when there is a todo task (Req 10.1)', () => {
    renderList([makeTask({ status: 'todo' })])
    expect(screen.getByRole('button', { name: /Clear all tasks/i })).not.toBeDisabled()
  })

  it('clear-all button is enabled when the only task is completed (Req 7.3)', () => {
    renderList([makeTask({ status: 'completed' })])
    expect(screen.getByRole('button', { name: /Clear all tasks/i })).not.toBeDisabled()
  })
})
