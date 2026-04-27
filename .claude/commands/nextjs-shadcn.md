# Next.js + shadcn/ui Skill

Foundational guidance for building modern React UIs with Next.js 16 App Router and shadcn/ui components. Always use bun as the package manager.

## Package Manager

**Always use bun** — never npm or npx:
```bash
bun install
bun add <package>
bunx --bun shadcn@latest add <component>
```

## Architecture Rules

### Server Actions vs Data Fetching
- Server Actions handle **mutations only** (create, update, delete)
- Data fetching belongs in **Server Components** or `'use cache'` functions
- Never use Server Actions for reading data

### Client Boundaries
- Apply `"use client"` only at the **smallest possible leaf component**
- Props crossing the server/client boundary must be serializable — no functions, no class instances
- Pass server-rendered content via the `children` prop

### Import Aliases
Always use `@/` aliases — never relative paths:
```ts
// Correct
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Never
import { Button } from '../../components/ui/button'
```

## File Structure

```
app/                  ← routes and layouts
components/
  ui/                 ← shadcn primitives (auto-generated, don't edit)
  shared/             ← business-logic components
hooks/                ← custom React hooks
lib/                  ← utilities (cn, formatters, etc.)
data/                 ← database queries (server-only)
ai/                   ← AI logic and prompts
```

## Next.js 16 Features

### Async Params
```ts
// app/vehicles/[id]/page.tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  // ...
}
```

### Caching
```ts
'use cache'
import { cacheTag, cacheLife } from 'next/cache'

export async function getVehicle(id: string) {
  cacheTag(`vehicle-${id}`)
  cacheLife('hours')
  return db.vehicles.findUnique({ where: { id } })
}
```

### Proxy API
Create `proxy.ts` at the project root for request interception.

## shadcn/ui Guidelines

### Styling
- Use `cn()` from `@/lib/utils` for all conditional classes
- Use semantic tokens: `bg-primary`, `text-muted-foreground`, `border-border`
- Never hardcode hex colors — use CSS variables from `globals.css`
- Never override component colors via `className`

### Design Aesthetic
- Minimize visual noise — icons communicate meaning, labels only when essential
- Avoid generic AI aesthetics: no purple gradients, no excessive shadows, no glassmorphism
- Use CSS variables from `globals.css` for theme consistency

### Component Patterns
```tsx
// Forms
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

// Correct card usage
<Card>
  <CardHeader>
    <CardTitle>Vehicles</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>

// Dialog always needs a title for accessibility
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Vehicle</DialogTitle>
    </DialogHeader>
    ...
  </DialogContent>
</Dialog>
```

## Dev Tools (Next.js 16+)

Add to `.mcp.json` for live error tracking and route inspection:
```json
{
  "mcpServers": {
    "next-devtools": {
      "url": "http://localhost:3000/_next/mcp"
    }
  }
}
```
