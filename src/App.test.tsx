import { render, screen, fireEvent } from '@testing-library/react'
import type { Idea, Task } from './types'
import { STORAGE_KEY } from './ideaStorage'
import { TASKS_KEY } from './taskStorage'
import App from './App'

// ── localStorage harness ─────────────────────────────────────────────────────

function installStore(opts: { ideas?: Idea[]; tasks?: Task[] } = {}) {
  const store: Record<string, string> = {}
  if (opts.ideas) store[STORAGE_KEY] = JSON.stringify(opts.ideas)
  if (opts.tasks) store[TASKS_KEY] = JSON.stringify(opts.tasks)
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: {
        getItem(k: string) {
          return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null
        },
        setItem(k: string, v: string) { store[k] = v },
      },
      confirm: vi.fn(() => true),
    },
    writable: true,
    configurable: true,
  })
  return store
}

beforeEach(() => {
  installStore()
})

// ── banners use role=alert (Req 14.3) ─────────────────────────────────────────

describe('banner accessibility', () => {
  it('notice banner has role=alert', () => {
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: { getItem() { throw new Error('unavail') }, setItem() {} },
        confirm: vi.fn(),
      },
      writable: true, configurable: true,
    })
    render(<App />)
    const alerts = screen.getAllByRole('alert')
    expect(alerts.length).toBeGreaterThan(0)
  })
})

// ── delete-task requires confirmation (Req 9.2, 9.4) ─────────────────────────

describe('delete task confirmation', () => {
  it('removes task when confirmed', () => {
    installStore({ tasks: [{ id: 't1', text: 'Kill me', priority: 'medium', status: 'todo', createdAt: 1 }] })
    ;(globalThis as unknown as { window: { confirm: ReturnType<typeof vi.fn> } }).window.confirm = vi.fn(() => true)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Delete task: Kill me/i }))
    expect(screen.queryByText('Kill me')).not.toBeInTheDocument()
  })

  it('keeps task when declined', () => {
    installStore({ tasks: [{ id: 't1', text: 'Keep me', priority: 'medium', status: 'todo', createdAt: 1 }] })
    ;(globalThis as unknown as { window: { confirm: ReturnType<typeof vi.fn> } }).window.confirm = vi.fn(() => false)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Delete task: Keep me/i }))
    expect(screen.getByText('Keep me')).toBeInTheDocument()
  })
})

// ── clear-all tasks requires confirmation (Req 10.3, 10.5) ───────────────────

describe('clear all tasks confirmation', () => {
  it('empties the task list when confirmed', () => {
    installStore({ tasks: [{ id: 't1', text: 'Task A', priority: 'low', status: 'todo', createdAt: 1 }] })
    ;(globalThis as unknown as { window: { confirm: ReturnType<typeof vi.fn> } }).window.confirm = vi.fn(() => true)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Clear all tasks/i }))
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument()
  })

  it('leaves tasks unchanged when declined', () => {
    installStore({ tasks: [{ id: 't1', text: 'Task B', priority: 'low', status: 'todo', createdAt: 1 }] })
    ;(globalThis as unknown as { window: { confirm: ReturnType<typeof vi.fn> } }).window.confirm = vi.fn(() => false)
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Clear all tasks/i }))
    expect(screen.getByText('Task B')).toBeInTheDocument()
  })
})

// ── editing a task opens the form with current text, cancel discards (Req 8.2, 8.4) ──

describe('edit task', () => {
  it('opens form with current task text', () => {
    installStore({ tasks: [{ id: 't1', text: 'Edit me', priority: 'high', status: 'todo', createdAt: 1 }] })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Edit task: Edit me/i }))
    expect(screen.getByRole('textbox')).toHaveValue('Edit me')
  })

  it('cancel returns to list with original text unchanged', () => {
    installStore({ tasks: [{ id: 't1', text: 'Original text', priority: 'medium', status: 'todo', createdAt: 1 }] })
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /Edit task: Original text/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(screen.getByText('Original text')).toBeInTheDocument()
  })
})
