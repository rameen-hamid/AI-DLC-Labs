import { render, screen, fireEvent } from '@testing-library/react'
import type { Task } from '../types'
import TaskItem from './TaskItem'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    text: 'Fix the bug',
    priority: 'medium',
    status: 'todo',
    createdAt: 1000,
    ...overrides,
  }
}

const noop = () => {}

function renderItem(task: Task, props?: Partial<React.ComponentProps<typeof TaskItem>>) {
  return render(
    <TaskItem
      task={task}
      onConvertToIdea={noop}
      onEdit={noop}
      onSetPriority={noop}
      onSetStatus={noop}
      onDelete={noop}
      {...props}
    />,
  )
}

describe('TaskItem', () => {
  it('renders the task text', () => {
    renderItem(makeTask({ text: 'Write a test' }))
    expect(screen.getByText('Write a test')).toBeInTheDocument()
  })

  it('non-completed task does NOT have task-completed class', () => {
    renderItem(makeTask({ status: 'todo' }))
    const span = screen.getByText('Fix the bug')
    expect(span).not.toHaveClass('task-completed')
  })

  it('completed task has task-completed class (Req 7.1)', () => {
    renderItem(makeTask({ status: 'completed' }))
    const span = screen.getByText('Fix the bug')
    expect(span).toHaveClass('task-completed')
  })

  it('renders a priority select with the current value selected', () => {
    renderItem(makeTask({ priority: 'high' }))
    const select = screen.getByDisplayValue('High')
    expect(select).toBeInTheDocument()
  })

  it('renders a status select with the current value selected', () => {
    renderItem(makeTask({ status: 'in-progress' }))
    const select = screen.getByDisplayValue('In progress')
    expect(select).toBeInTheDocument()
  })

  it('priority select has an accessible label', () => {
    renderItem(makeTask())
    // The visually-hidden label is associated via aria-labelledby
    expect(screen.getByDisplayValue('Medium').hasAttribute('aria-labelledby')).toBe(true)
  })

  it('status select has an accessible label', () => {
    renderItem(makeTask())
    expect(screen.getByDisplayValue('To do').hasAttribute('aria-labelledby')).toBe(true)
  })

  it('renders convert-to-idea button with accessible name (Req 2.1)', () => {
    renderItem(makeTask({ text: 'My task' }))
    expect(screen.getByRole('button', { name: /Convert task to idea: My task/i })).toBeInTheDocument()
  })

  it('renders edit button with accessible name (Req 8.1)', () => {
    renderItem(makeTask({ text: 'My task' }))
    expect(screen.getByRole('button', { name: /Edit task: My task/i })).toBeInTheDocument()
  })

  it('renders delete button with accessible name (Req 9.1)', () => {
    renderItem(makeTask({ text: 'My task' }))
    expect(screen.getByRole('button', { name: /Delete task: My task/i })).toBeInTheDocument()
  })

  it('calls onSetPriority with the new value when changed', () => {
    const onSetPriority = vi.fn()
    renderItem(makeTask({ id: 't1', priority: 'medium' }), { onSetPriority })
    fireEvent.change(screen.getByDisplayValue('Medium'), { target: { value: 'low' } })
    expect(onSetPriority).toHaveBeenCalledWith('t1', 'low')
  })

  it('calls onSetStatus with the new value when changed', () => {
    const onSetStatus = vi.fn()
    renderItem(makeTask({ id: 't1', status: 'todo' }), { onSetStatus })
    fireEvent.change(screen.getByDisplayValue('To do'), { target: { value: 'completed' } })
    expect(onSetStatus).toHaveBeenCalledWith('t1', 'completed')
  })

  it('calls onConvertToIdea with the task when button clicked', () => {
    const onConvertToIdea = vi.fn()
    const task = makeTask()
    renderItem(task, { onConvertToIdea })
    fireEvent.click(screen.getByRole('button', { name: /Convert task to idea/i }))
    expect(onConvertToIdea).toHaveBeenCalledWith(task)
  })

  it('calls onEdit with the task id when edit button clicked', () => {
    const onEdit = vi.fn()
    renderItem(makeTask({ id: 't99' }), { onEdit })
    fireEvent.click(screen.getByRole('button', { name: /Edit task/i }))
    expect(onEdit).toHaveBeenCalledWith('t99')
  })

  it('calls onDelete with the task when delete button clicked', () => {
    const onDelete = vi.fn()
    const task = makeTask()
    renderItem(task, { onDelete })
    fireEvent.click(screen.getByRole('button', { name: /Delete task/i }))
    expect(onDelete).toHaveBeenCalledWith(task)
  })
})
