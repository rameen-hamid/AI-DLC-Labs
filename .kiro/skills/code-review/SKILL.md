---
name: code-review
description: Reviews .ts and .tsx files in this project (idea-board, mainly under src/) for typed props, named exports, error handling on async calls, and accessibility (aria labels, semantic HTML), then reports findings under Critical, Warnings, Suggestions and Passed. Use when the user asks to review, audit or check a .ts or .tsx file, or asks for a code review of src/ changes before a commit or pull request. Do not use for other file types (CSS, JSON, Markdown), for running the linter, build or scanners, or for writing new code. Read-only, it never edits the file.
---

# Code review for React/TypeScript files

Review one file against four checks and report the result in a fixed format. This skill only reads and reports. Do not edit the reviewed file unless the user asks for fixes afterwards.

## Workflow

1. Identify the file(s). Only `.ts` and `.tsx` files are in scope. If the user gave none, ask which file. If they gave a file of another type, say it is out of scope and stop. If they gave several, review each one separately and give one report per file.
2. Read the whole file with line numbers (for example the read tool, or `grep -n`). Take every line number from that output. Never estimate or count lines by hand. Read files it imports from the same project only when needed to judge a finding (for example the type of a prop that is imported).
3. Run the four checks below. Record each finding with its file path and line number as you go.
4. Assign each finding one severity using the rules below.
5. Before writing, re-check each cited line number against the numbered output, and drop or fix any finding whose file or line you cannot confirm.
6. Write the report in the exact format in "Output format".

Do not run the linter or compiler as part of this review. Report what the code shows. Do not report style preferences that are not in the four checks.

## The four checks

### 1. Typed props
- Every component that takes props has an explicit type for them (`type XProps = {...}`, `interface XProps`, or an inline type on the parameter).
- Look for: props destructured with no type, `props: any`, `props: object`, `props: {}` used with fields, `Function` as a callback type, `any` or `unknown` fields where a real type is known, `React.FC` or `FC` without a props type.
- Callback props have a function signature (`(id: string) => void`), not `Function`.
- Components that take no props pass this check.

### 2. Named exports
- Components, hooks and helpers use `export function Name` or `export const Name`, not `export default`.
- Exceptions that are NOT findings: config files (`vite.config.ts`, `*.config.ts`), files a framework requires to default-export (route or page files), and modules loaded with `React.lazy`, which needs a default export. Mention an exception under Passed with the reason.
- Also check that the exported name matches the file name for a component file.
- Check the whole file, not only the first export. A file that mixes named and default exports is a finding.

### 3. Error handling on async calls
- Every `await`, `.then(...)` and un-awaited promise (`fetch`, `axios`, `Promise.all`, dynamic `import()`, custom async functions) must have a failure path.
- Acceptable: `try/catch` around the `await`, `.catch(...)`, a second argument to `.then`, or an error state that is rendered to the user.
- Look for: `await` outside `try`, `.then()` with no `.catch()`, `async` functions passed to `onClick` or `useEffect` with no handling, floating promises (a call that returns a promise and is neither awaited nor handled), `catch {}` that swallows the error silently, and `response.ok` not checked after `fetch`.
- A `catch` that only logs to the console and shows nothing to the user is a Warning. A missing handler is Critical.
- An `async` function inside `useEffect` must be defined inside the effect and called, because the effect callback itself cannot be async.
- Files with no async code pass this check. Say "no async calls in this file".

### 4. Accessibility
- **Accessible names.** Every interactive control needs a text name: visible text, `aria-label`, `aria-labelledby`, or a `<label htmlFor>` tied to the input `id`. Icon-only buttons, inputs with only a `placeholder`, and links with no text fail.
- **Images.** `<img>` has an `alt` (empty `alt=""` is right for decorative images). SVGs that carry meaning have a `<title>` or `aria-label`; decorative ones have `aria-hidden="true"`.
- **Semantic HTML.** Use `<button>` for actions and `<a href>` for navigation, not `<div onClick>` or `<span onClick>`. Use `<ul>/<li>` for lists, `<nav>`, `<main>`, `<header>`, `<form>`, and real headings in order (no jump from `h1` to `h4`). A clickable non-interactive element needs `role`, `tabIndex` and a key handler, but prefer replacing it with a real element.
- **Forms.** Error messages are linked to their input with `aria-describedby` and `aria-invalid`, and appear in a `role="alert"` or `aria-live` region so screen readers announce them.
- **Misuse.** `aria-label` that repeats the visible text is fine. `role` on an element that already has that role, `tabIndex` above 0, and `aria-hidden` on focusable elements are findings.
- Files with no JSX (hooks, utilities) pass this check. Say "no JSX in this file".

## Severity rules

| Severity | Use it when |
| --- | --- |
| Critical | A user or screen-reader user is blocked, or a failure can go unhandled: an async call with no failure path, an interactive control with no accessible name, `<div onClick>` with no keyboard support, `<img>` with no `alt`, props typed `any` on a public component. |
| Warnings | Code works but breaks a rule of the four checks and will cause trouble later: `export default` where a named export is expected, `Function` as a callback type, a `catch` that only logs, heading levels skipped, error text not linked to its input. |
| Suggestions | Optional improvements inside the four checks: add `aria-live` to a status message, extract a `Props` type, add a `title` to a decorative SVG, rename a file to match its export. |
| Passed | A check or sub-check that was examined and has no finding. |

When unsure between two severities, choose the lower one and say why in the finding.

## Output format

Use this exact structure. Keep all four sections even when one is empty, and write `None.` for an empty section.

```
# Code review: <path/to/File.tsx>

**Verdict:** <Changes needed | Approve with comments | Approved>

## Critical
- `<path/to/File.tsx>:<line>` <what is wrong, in one sentence>. Fix: <specific change>.

## Warnings
- `<path/to/File.tsx>:<line>` <what is wrong>. Fix: <specific change>.

## Suggestions
- `<path/to/File.tsx>:<line>` <optional improvement>.

## Passed
- Typed props: <one line of evidence, or the reason it does not apply>
- Named exports: <one line of evidence>
- Async error handling: <one line of evidence>
- Accessibility: <one line of evidence>
```

Rules for the report:
- Verdict is "Changes needed" if there is any Critical item, "Approve with comments" if there are only Warnings or Suggestions, and "Approved" if there are none.
- Every finding in Critical, Warnings and Suggestions MUST start with the file path and line in backticks, as `path/to/File.tsx:<line>`. Use the path relative to the repository root (for example `src/components/IdeaList.tsx:45`). A finding without a file and line is invalid: find the line or remove the finding.
- Use the line where the problem is. For a range, write `File.tsx:<start>-<end>`. If the same problem occurs on several lines, either write one finding per line or list them, `File.tsx:12, 30, 48`. Never write "throughout the file".
- For a problem caused by something missing (no `alt`, no `try/catch`, no props type), cite the line of the element or call that lacks it. For a file-wide problem such as `export default`, cite the line of that declaration.
- Each finding also gives a concrete fix. Quote at most one short code fragment per finding.
- In Passed, cite line numbers as evidence where they exist, for example `(lines 4-9)`.
- Under Passed, list a check only if it has no Critical or Warning findings. Do not list a check under both Passed and Critical or Warnings. If a check has only Suggestions, it may also appear in Passed.
- Write findings in the order they appear in the file.
- Do not add other sections, praise, or a closing summary.

## Example

Input file `src/components/Avatar.tsx`:

```tsx
export default function Avatar({ user, onPick }) {
  const load = async () => { const r = await fetch('/u/' + user.id); setData(await r.json()) }
  return <div onClick={onPick}><img src={user.url} /></div>
}
```

Output:

```
# Code review: src/components/Avatar.tsx

**Verdict:** Changes needed

## Critical
- `src/components/Avatar.tsx:1` Props are destructured with no type, so `user` and `onPick` are implicitly `any`. Fix: add `type AvatarProps = { user: User; onPick: () => void }`.
- `src/components/Avatar.tsx:2` `await fetch(...)` has no `try/catch` and `response.ok` is not checked. Fix: wrap in `try/catch`, check `r.ok`, and set an error state.
- `src/components/Avatar.tsx:3` `<div onClick>` cannot be reached or activated with the keyboard. Fix: use `<button type="button" onClick={onPick}>`.
- `src/components/Avatar.tsx:3` `<img>` has no `alt`. Fix: add `alt={user.name}`, or `alt=""` if decorative.

## Warnings
- `src/components/Avatar.tsx:1` Uses `export default`. Fix: `export function Avatar(...)` and update imports.

## Suggestions
None.

## Passed
None.
```
