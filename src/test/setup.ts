import '@testing-library/jest-dom/vitest'

// Required for React act() warnings to be suppressed in test environment.
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
