# Fonts & Icons — Professional Refresh

**Date:** 2026-04-26  
**Status:** Approved

## Goal

Replace the current Syne + DM Sans font pairing and scattered emoji/inline-SVG icons with a consistent, professional Inter font stack and Lucide React icon library across all pages.

## Font Changes

### Current
- Display: Syne (Google Fonts `@import` in `globals.css`)
- Body: DM Sans (Google Fonts `@import`)
- Mono: DM Mono (Google Fonts `@import`)

### New
- Display + Body: **Inter** — loaded via `next/font/google` in `app/layout.tsx`
- Mono: **DM Mono** — unchanged, loaded via `next/font/google`

### Implementation
1. Remove the three-font `@import` URL from `app/globals.css`
2. In `app/layout.tsx`, import `Inter` and `DM_Mono` from `next/font/google`, generate CSS variables `--font-body`, `--font-display`, `--font-mono`
3. Apply `className` from the font objects to the `<html>` element
4. CSS variables in `globals.css` stay as-is; Tailwind config stays as-is — they already reference the CSS vars

## Icon Changes

### Package
Install `lucide-react`. No other icon packages needed.

### Replacement map

**`app/dashboard/layout.tsx`**
- Overview nav: `LayoutGrid`
- Call Logs nav: `Phone`
- Appointments nav: `CalendarDays`
- Customers nav: `Users`
- Settings nav: `Settings`
- Theme toggle dark→light: `Sun`
- Theme toggle light→dark: `Moon`
- Mobile menu open: `Menu`
- Mobile menu close: `X`
- Sign-out button: `LogOut`
- Logo icon (home): keep existing gradient SVG (it's a brand mark, not a UI icon)

**`app/dashboard/overview/page.tsx`** — STAT_CARDS array
- 📞 Total Calls → `Phone`
- ⏱ Total Minutes → `Clock`
- 📊 Avg Duration → `BarChart2`
- 📅 Bookings → `CalendarCheck`
- ❌ Cancelled → `XCircle`
- 👥 Customers → `Users`

**`app/dashboard/appointments/page.tsx`**
- `☰ List` view toggle → `<List size={13} />` + "List"
- `📅 Calendar` view toggle → `<CalendarDays size={13} />` + "Calendar"
- `← Prev` / `Next →` calendar nav → `<ChevronLeft />` / `<ChevronRight />`

**`app/dashboard/customers/page.tsx`**
- `📞` in profile header → `<Phone size={13} />`
- `📍` in profile header → `<MapPin size={13} />`
- Search input icon (already inline SVG) → `<Search size={13} />`
- Empty-state large user icon (already inline SVG) → `<Users size={48} />`

**`app/dashboard/settings/page.tsx`**
- `⚠️` in API keys warning → `<AlertTriangle size={13} />`
- `✓ Saved successfully` text → `<CheckCircle size={13} />` + " Saved successfully"

**`app/dashboard/call-logs/page.tsx`**
- Download/export button icon (inline SVG) → `<Download size={13} />`
- Search input icon (inline SVG) → `<Search size={13} />`
- Expand/collapse chevron (inline SVG) → `<ChevronDown size={14} />`

**`app/login/page.tsx`** — no changes needed (no emoji, font classes update automatically)

## Files Changed

| File | Change |
|------|--------|
| `app/globals.css` | Remove `@import` URL |
| `app/layout.tsx` | Add `next/font/google` imports + CSS var injection |
| `app/dashboard/layout.tsx` | Lucide nav, toggle, menu, sign-out icons |
| `app/dashboard/overview/page.tsx` | Lucide stat card icons |
| `app/dashboard/appointments/page.tsx` | Lucide view toggle + calendar nav |
| `app/dashboard/customers/page.tsx` | Lucide profile icons + search |
| `app/dashboard/settings/page.tsx` | Lucide warning + saved icons |
| `app/dashboard/call-logs/page.tsx` | Lucide export + search + chevron |

## Out of Scope

- Color scheme changes
- Layout or spacing changes
- Component restructuring
- `app/page.tsx` (root redirect page — no visual content)
