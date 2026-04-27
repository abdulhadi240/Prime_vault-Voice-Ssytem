# Next.js Performance

Expert guidance for optimizing Next.js applications. Apply when improving Core Web Vitals (LCP, INP, CLS), reducing bundle size, or implementing caching strategies.

## When to Use

- Enhancing Core Web Vitals for SEO / user experience
- Migrating Client Components to Server Components
- Implementing or tuning caching strategies
- Bundle analysis and code splitting
- Enabling Suspense streaming for progressive rendering
- Applying Next.js 16 + React 19 patterns

## Image Optimization

```tsx
// Before
<img src="/hero.jpg" />

// After
import Image from 'next/image'
<Image src="/hero.jpg" alt="..." width={1200} height={630} priority />
// - Add priority to LCP images
// - Always provide explicit width + height (prevents CLS)
// - Use loading="lazy" (default) for below-fold images
// - Prefer WebP/AVIF sources
```

## Font Optimization

```tsx
// Before — causes layout shift
import '../styles/fonts.css'  // or <link href="google fonts">

// After — zero layout shift
import { Inter, Playfair_Display } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], display: 'swap' })
```

## Server Component Migration

The highest-impact optimization. Convert `useEffect` + fetch to direct Server Component data access:

```tsx
// Before (Client Component)
'use client'
export function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  useEffect(() => { fetch('/api/vehicles').then(...) }, [])
  return <ul>{vehicles.map(...)}</ul>
}

// After (Server Component)
export async function VehicleList() {
  const vehicles = await db.vehicles.findMany()
  return <ul>{vehicles.map(...)}</ul>
}
```

## Caching Strategies

```ts
// Granular cache with tag-based invalidation (Next.js 15+)
import { unstable_cache } from 'next/cache'

export const getVehicles = unstable_cache(
  async () => db.vehicles.findMany(),
  ['vehicles-list'],
  { revalidate: 3600, tags: ['vehicles'] }
)

// Next.js 16 "use cache"
'use cache'
import { cacheTag, cacheLife } from 'next/cache'
export async function getVehicles() {
  cacheTag('vehicles')
  cacheLife('hours')
  return db.vehicles.findMany()
}

// Invalidate
import { revalidateTag } from 'next/cache'
revalidateTag('vehicles')
```

## Bundle Optimization

```tsx
// Lazy-load heavy components
import dynamic from 'next/dynamic'

const HeavyMap = dynamic(() => import('@/components/Map'), {
  loading: () => <MapSkeleton />,
  ssr: false,    // use for browser-only libs
})
```

- Analyze bundle: `ANALYZE=true next build` (requires `@next/bundle-analyzer`)
- Virtualize lists exceeding 50 items (`react-window` or `react-virtual`)

## Streaming with Suspense

```tsx
// app/vehicles/page.tsx
import { Suspense } from 'react'
import { VehicleList } from '@/components/VehicleList'
import { VehicleListSkeleton } from '@/components/skeletons'

export default function Page() {
  return (
    <main>
      <h1>Inventory</h1>
      <Suspense fallback={<VehicleListSkeleton />}>
        <VehicleList />   {/* async Server Component */}
      </Suspense>
    </main>
  )
}
```

## Core Web Vitals Targets

| Metric | Target | Common causes of failure |
|--------|--------|--------------------------|
| LCP | < 2.5s | No `priority` on hero image, render-blocking fonts |
| INP | < 200ms | Large JS bundles, heavy event handlers |
| CLS | < 0.1 | Missing image dimensions, late-loading fonts |

## Constraints

- Server Components cannot use browser APIs, hooks, or event handlers
- Image optimization requires explicit `width` + `height`
- Tag-based cache invalidation requires manual `revalidateTag` calls
- `dynamic()` with `ssr: false` excludes content from SSR — may hurt SEO for critical content
