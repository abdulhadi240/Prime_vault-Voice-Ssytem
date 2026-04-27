# Next.js Best Practices

Opinionated guidance for structuring and scaling Next.js App Router applications. Apply this when architecting new features, reviewing component boundaries, or fixing anti-patterns.

## Core Principle

**Server Components are the default for a reason. Start there; add `"use client"` only when required.**

## Component Strategy

| Use Server Components for | Use Client Components for |
|--------------------------|--------------------------|
| Data fetching | Forms and event handlers |
| Layouts and static content | Browser APIs (`window`, `localStorage`) |
| Components that don't need interactivity | React hooks (`useState`, `useEffect`) |
| Direct database/API calls | Third-party client-only libraries |

**Split architecture pattern:** Server parent fetches data and passes it as props to a Client Component child. Keep the Client boundary as small and as deep in the tree as possible.

## Data Fetching Patterns

| Pattern | When to use |
|---------|-------------|
| Server Component fetch | Default — static or user-specific data |
| ISR (`revalidate`) | Content that refreshes on a schedule |
| `cache: 'no-store'` | Per-request freshness required |
| Server Action | User-triggered mutations |
| `"use cache"` + `cacheTag` | Shared cached reads with granular invalidation |

- Database queries belong in Server Components
- User input flows through client state + Server Actions
- Never fetch in Client Components when a Server Component can do it

## Anti-Patterns — Never Do These

- Mark everything `"use client"` by default
- Fetch data inside Client Components with `useEffect`
- Skip `loading.tsx` — always add Suspense boundaries for async segments
- Ignore `error.tsx` — every dynamic segment needs an error boundary
- Ship large third-party libraries to the client without `dynamic()` + `{ ssr: false }`

## Project Structure

```
app/
  (marketing)/        ← route group, no URL segment
  (dashboard)/        ← route group, no URL segment
    layout.tsx
    page.tsx
    loading.tsx
    error.tsx
components/
  ui/                 ← primitive components
  shared/             ← business-logic components
lib/
data/                 ← database queries (Server-only)
hooks/                ← Client-only hooks
```

## Performance

- `next/image` with `priority` on LCP images; blur placeholder on non-critical ones
- Generate metadata per route with `generateMetadata()`
- Use `dynamic()` for heavy components that aren't needed on initial render
- Caching layers: request → data (`unstable_cache` / `"use cache"`) → full route (ISR)

## Route Handlers

```ts
// app/api/vehicles/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // validate input, query DB, return Response
}
```

- Always validate input at route handler boundaries
- Return appropriate HTTP status codes
- Use route handlers for REST operations; prefer Server Actions for form mutations
