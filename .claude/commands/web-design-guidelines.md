# Web Design Guidelines

Audit UI code against Vercel's web interface best practices. Activates when a user asks to "check my site against best practices", "audit design", "review for accessibility", or similar.

## Process

1. **Fetch fresh guidelines** before each review — always pull the latest ruleset:
   ```
   https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
   ```
2. **Analyze the specified files** against all fetched rules.
3. **Report findings** in the compact format described below.

If the user does not specify files, ask which files or glob patterns to review.

## Output Format

- Group results by file.
- Report each issue as: `file:line - description`
- Mark fully passing files with `✓ pass`
- Omit explanations unless the fix is non-obvious.

## Rule Categories (from fetched guidelines)

The live guidelines cover 13 categories. Current snapshot for reference — always prefer the fetched version:

- **Accessibility** — `aria-label` on icon buttons, `<label>` on inputs, semantic HTML, `aria-live` for async updates, `alt` on images.
- **Focus States** — visible `focus-visible:ring-*`; never `outline-none` without a replacement; prefer `:focus-visible` over `:focus`.
- **Forms** — `autocomplete`, `name`, correct `type`; disable spellcheck on sensitive fields; inline errors with focus on first error; submit button stays enabled until request starts.
- **Animation** — respect `prefers-reduced-motion`; animate only `transform`/`opacity`; avoid `transition: all`; animations must be interruptible.
- **Typography** — proper ellipsis (`…`), curly quotes, non-breaking spaces; `text-wrap: balance` on headings.
- **Content Handling** — overflow via `truncate`, `line-clamp-*`, or `break-words`; handle empty states and varied input lengths.
- **Images** — explicit `width`/`height`; `loading="lazy"` for below-fold images.
- **Performance** — virtualize lists > 50 items; no layout reads during render; batch DOM ops; `preconnect` and font `preload`.
- **Navigation & State** — URL reflects state (filters, tabs, pagination); all stateful UI deep-linkable; destructive actions require confirmation.
- **Touch & Interaction** — `touch-action: manipulation`; `overscroll-behavior: contain` in modals; no text selection during drag.
- **Safe Areas & Layout** — `env(safe-area-inset-*)` for full-bleed layouts; prefer Flex/Grid over JS measurement.
- **Dark Mode & Theming** — `color-scheme: dark`; `<meta name="theme-color">`; explicit colors for native `<select>`.
- **Locale & i18n** — `Intl.DateTimeFormat` / `Intl.NumberFormat`; `translate="no"` on brand names.
