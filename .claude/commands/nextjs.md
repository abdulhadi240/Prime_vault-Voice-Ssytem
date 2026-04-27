# Next.js App Router Skill

Expert guidance for building, debugging, and architecting Next.js applications using the App Router. Targets Next.js 15/16 with React Server Components.

## Component Model

- **Server Components are the default** — data fetching, layouts, and static content
- Add `"use client"` only when the component requires browser APIs, React hooks, or event handlers
- Add `"use server"` for Server Actions (mutations only — never for data reads)
- Add `"use cache"` for cached data functions
- Position Client Components at leaf nodes — pass server content via `children` when possible

## Detection: Flag These Patterns

Immediately flag and correct:
- Pages Router patterns: `getServerSideProps`, `getStaticProps`, `next/router`, `next/head`
- Missing `"use client"` on components using React hooks or event handlers
- Unawaited `cookies()`, `headers()`, `params`, `searchParams` in Next.js 16+ (these are now async)
- External font loaders — migrate to `next/font`
- In-process caches that don't survive serverless cold starts
- Heavy ORMs without serverless-aware connection pooling

## Data Fetching

- Fetch in Server Components by default
- Avoid data waterfalls — use `Promise.all` + Suspense for parallel fetches
- Route handlers for REST-style APIs
- Server Actions for mutations (form submissions, updates, deletes)
- Never call Server Actions from Server Components for reads

## Routing

- Dynamic segments: `[slug]`, `[...slug]`, `[[...slug]]`
- Route groups: `(group)` — organizes without affecting URL
- Parallel routes: `@slot` — multiple views in one layout
- Intercepting routes: `(.)`, `(..)`, `(...)` — modal patterns
- Middleware: use for auth, redirects, A/B testing (Next.js 16: use proxy API for complex cases)

## Async APIs (Next.js 16+)

Always `await` these — they are async in Next.js 16:
```ts
const cookieStore = await cookies()
const headersList = await headers()
const { id } = await params         // page props
const { q } = await searchParams    // page props
```

## Images & Fonts

- Always use `next/image` — never `<img>` tags
- Always provide `sizes` attribute on responsive images
- Always use `next/font` — never CSS font imports or Google Fonts `<link>` tags

## Metadata

```ts
// Static
export const metadata: Metadata = { title: '...', description: '...' }

// Dynamic
export async function generateMetadata({ params }): Promise<Metadata> { ... }

// OG images: use next/og in a route handler
```

## Caching (Next.js 16)

```ts
'use cache'
import { cacheTag, cacheLife } from 'next/cache'

export async function getData() {
  cacheTag('my-data')
  cacheLife('hours')
  // fetch...
}
```

## Error & Loading States

| File | Purpose |
|------|---------|
| `loading.tsx` | Suspense fallback for the segment |
| `error.tsx` | Error boundary — must be a Client Component |
| `not-found.tsx` | 404 for `notFound()` throws |
| `global-error.tsx` | Root-level error boundary |

## Deployment

- Self-host: set `output: 'standalone'` in `next.config`
- Multi-instance ISR: configure a custom cache handler
- Vercel: zero-config; Edge Runtime available for middleware

## Skill Chains

When these patterns are detected, apply the corresponding skill:
- Auth code → `auth` skill
- shadcn components → `shadcn` skill
- Storage/DB → `vercel-storage` skill
- AI features → `ai-gateway` skill
