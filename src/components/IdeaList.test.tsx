import { render, screen, fireEvent } from '@testing-library/react'
import type { Idea } from '../types'
import IdeaList from './IdeaList'

function makeIdea(overrides: Partial<Idea> = {}): Idea {
  return { id: 'i1', text: 'An idea', createdAt: 1000, ...overrides }
}

const noop = () => {}

function renderList(ideas: Idea[], props?: Partial<React.ComponentProps<typeof IdeaList>>) {
  return render(
    <IdeaList
      ideas={ideas}
      onConvertToTask={noop}
      onEdit={noop}
      onDelete={noop}
      {...props}
    />,
  )
}

describe('IdeaList – convert to task', () => {
  it('renders a convert-to-task button for each idea (Req 1.1)', () => {
    renderList([
      makeIdea({ id: '1', text: 'First idea' }),
      makeIdea({ id: '2', text: 'Second idea' }),
    ])
    expect(screen.getByRole('button', { name: /Convert idea to task: First idea/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Convert idea to task: Second idea/i })).toBeInTheDocument()
  })

  it('button has an accessible label that includes the idea text (Req 14.2)', () => {
    renderList([makeIdea({ text: 'My specific idea' })])
    const btn = screen.getByRole('button', { name: /Convert idea to task: My specific idea/i })
    expect(btn).toBeInTheDocument()
  })

  it('calls onConvertToTask with the correct idea when clicked', () => {
    const onConvertToTask = vi.fn()
    const idea = makeIdea({ id: 'x1', text: 'Click me' })
    renderList([idea], { onConvertToTask })
    fireEvent.click(screen.getByRole('button', { name: /Convert idea to task: Click me/i }))
    expect(onConvertToTask).toHaveBeenCalledWith(idea)
  })

  it('convert button is disabled when disabled prop is true', () => {
    renderList([makeIdea({ text: 'Disabled test' })], { disabled: true })
    expect(screen.getByRole('button', { name: /Convert idea to task: Disabled test/i })).toBeDisabled()
  })
})
