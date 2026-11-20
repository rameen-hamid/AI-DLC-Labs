import type { Task } from './types'
import { TASKS_KEY, loadTasks, saveTasks } from './taskStorage'
import { STORAGE_KEY } from './ideaStorage'

// ── localStorage mock ────────────────────────────────────────────────────────

function makeStore(): Record<string, string> {
  return {}
}

function installStorage(
  store: Record<string, string>,
  opts: { throwGet?: boolean; throwSet?: boolean; quotaOnSet?: boolean } = {},
) {
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: {
        getItem(key: string) {
          if (opts.throwGet) throw new Error('unavailable')
          return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
        },
        setItem(key: string, value: string) {
          if (opts.quotaOnSet) {
            const err = new DOMException('QuotaExceededError', 'QuotaExceededError')
            throw err
          }
          if (opts.throwSet) throw new Error('failed')
          store[key] = value
        },
      },
    },
    writable: true,
    configurable: true,
  })
}

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

beforeEach(() => {
  installStorage(makeStore())
})

// ── Property 9: storage round-trip ───────────────────────────────────────────

describe('round-trip', () => {
  it('saveTasks then loadTasks returns the same array', () => {
    const tasks: Task[] = [
      makeTask({ id: '1', text: 'First', priority: 'high', status: 'todo', createdAt: 1 }),
      makeTask({ id: '2', text: 'Second', priority: 'low', status: 'completed', createdAt: 2 }),
    ]
    expect(saveTasks(tasks)).toEqual({ ok: true })
    const result = loadTasks()
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.tasks).toEqual(tasks)
    }
  })

  it('saveTasks([]) then loadTasks returns empty ok', () => {
    saveTasks([])
    const result = loadTasks()
    expect(result.status).toBe('ok')
    if (result.status === 'ok') expect(result.tasks).toHaveLength(0)
  })
})

// ── Property 10: storage key isolation ───────────────────────────────────────

describe('key isolation', () => {
  it('writing tasks does not change the ideas key', () => {
    const store: Record<string, string> = { [STORAGE_KEY]: '[{"id":"i","text":"idea","createdAt":1}]' }
    installStorage(store)
    saveTasks([makeTask()])
    expect(store[STORAGE_KEY]).toBe('[{"id":"i","text":"idea","createdAt":1}]')
  })
})

// ── Property 11: loadTasks is non-destructive on unreadable data ──────────────

describe('unreadable data', () => {
  it('returns unreadable when stored value is not valid JSON', () => {
    const store: Record<string, string> = { [TASKS_KEY]: '{bad' }
    installStorage(store)
    const result = loadTasks()
    expect(result.status).toBe('unreadable')
    expect(result.tasks).toHaveLength(0)
    expect(store[TASKS_KEY]).toBe('{bad') // bytes untouched
  })

  it('returns unreadable when stored value is not an array', () => {
    const store: Record<string, string> = { [TASKS_KEY]: '{}' }
    installStorage(store)
    expect(loadTasks().status).toBe('unreadable')
  })

  it('returns unreadable when array contains an invalid task', () => {
    const store: Record<string, string> = {
      [TASKS_KEY]: '[{"id":"1","text":"t","createdAt":1,"priority":"invalid","status":"todo"}]',
    }
    installStorage(store)
    expect(loadTasks().status).toBe('unreadable')
  })
})

// ── unavailable storage ───────────────────────────────────────────────────────

describe('unavailable storage', () => {
  it('loadTasks returns unavailable when getItem throws', () => {
    installStorage(makeStore(), { throwGet: true })
    expect(loadTasks().status).toBe('unavailable')
  })
})

// ── Property 12: isTask guards (via loadTasks) ────────────────────────────────

describe('type guard coverage', () => {
  it.each([
    ['missing priority', '{"id":"1","text":"t","createdAt":1,"status":"todo"}'],
    ['missing status', '{"id":"1","text":"t","createdAt":1,"priority":"medium"}'],
    ['bad priority value', '{"id":"1","text":"t","createdAt":1,"priority":"urgent","status":"todo"}'],
    ['bad status value', '{"id":"1","text":"t","createdAt":1,"priority":"medium","status":"done"}'],
    ['non-finite createdAt', '{"id":"1","text":"t","createdAt":null,"priority":"medium","status":"todo"}'],
  ])('rejects task with %s', (_label, json) => {
    const store: Record<string, string> = { [TASKS_KEY]: `[${json}]` }
    installStorage(store)
    expect(loadTasks().status).toBe('unreadable')
  })
})

// ── quota error ───────────────────────────────────────────────────────────────

describe('save failures', () => {
  it('returns reason full on QuotaExceededError', () => {
    installStorage(makeStore(), { quotaOnSet: true })
    const result = saveTasks([makeTask()])
    expect(result).toEqual({ ok: false, reason: 'full' })
  })

  it('returns reason failed on generic error', () => {
    installStorage(makeStore(), { throwSet: true })
    const result = saveTasks([makeTask()])
    expect(result).toEqual({ ok: false, reason: 'failed' })
  })
})
