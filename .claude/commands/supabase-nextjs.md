# Supabase + Next.js Skill

Guidance for building Next.js App Router applications with Supabase authentication and Drizzle ORM for type-safe database access.

## Core Architecture Principle

**Drizzle for queries. Supabase for auth and storage. Server Components by default.**

Use server components whenever possible — client components only for essential interactivity.

## Dependencies

```bash
bun add @supabase/supabase-js @supabase/ssr drizzle-orm postgres
bun add -D drizzle-kit
```

## Environment Variables

```env
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only
DATABASE_URL=          # Supabase direct connection with ?prepare=false
SUPABASE_SERVICE_KEY=  # Never expose clientside
```

Use `prepare: false` in the database URL for Supabase connection pooling compatibility.

## Database Layer (Drizzle)

```ts
// drizzle.config.ts
export default {
  schema: './src/db/schema.ts',
  out: './supabase/migrations',
  driver: 'pg',
  dbCredentials: { connectionString: process.env.DATABASE_URL! },
}

// src/db/schema.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

## Supabase Clients

```ts
// src/lib/supabase/client.ts — browser (client components)
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// src/lib/supabase/server.ts — server components / actions / route handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

## Middleware (Session Refresh)

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(...)

  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  return response
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
```

## Data Operations

```ts
// src/db/queries/vehicles.ts — reusable, type-safe query functions
import { db } from '@/lib/db'
import { vehicles } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getVehicles() {
  return db.select().from(vehicles)
}

// Server Actions — mutations only, always revalidate cache
'use server'
import { revalidatePath } from 'next/cache'

export async function createVehicle(data: NewVehicle) {
  await db.insert(vehicles).values(data)
  revalidatePath('/vehicles')
}
```

## Anti-Patterns — Never Do These

- Use Supabase client (`supabase.from(...)`) for database queries — use Drizzle instead
- Fetch data in client components — use Server Components
- Omit middleware — sessions won't refresh and users will appear logged out
- Expose `SUPABASE_SERVICE_KEY` to the client
- Skip `revalidatePath` / `revalidateTag` after mutations — stale cache will persist
