# Batch 1: Bugs, Quick Wins & Kanban — Design Spec

**Date:** 2026-04-26  
**Status:** Approved

## Goal

Fix two runtime bugs, set light theme as default, add a prominent minutes hero stat to the overview header, and add a drag-and-drop Kanban view to the appointments page.

---

## 1. Fix `cost.toFixed` TypeError

**Problem:** `cost` arrives from Supabase as a string, so `(call.cost || 0).toFixed(4)` throws `TypeError: .toFixed is not a function`.

**Fix:** Wrap with `Number()` in both locations in `app/dashboard/call-logs/page.tsx`:
- Line ~63 (CSV export row): `Number((c as any).cost || 0).toFixed(4)`
- Line ~138 (expanded detail panel): `Number((call as any).cost || 0).toFixed(4)`

---

## 2. Fix Recent Calls Status Badges

**Problem:** Every call status badge shows the same blue color regardless of value. Status values from Vapi/Supabase include: `ended`, `completed`, `failed`, `error`, `busy`, `no-answer`, `cancelled`, `in-progress`, `initiated`, `queued`.

**Fix:** Add a `getCallStatusStyle(status: string)` helper in `lib/utils.ts` that returns `{ background, color }` inline style:

| Status values | Background | Color |
|---|---|---|
| `ended`, `completed` | `rgba(74,222,128,0.12)` | `var(--success)` |
| `failed`, `error`, `busy`, `no-answer`, `cancelled` | `rgba(248,113,113,0.12)` | `var(--danger)` |
| `in-progress`, `initiated`, `queued` | `rgba(79,142,247,0.12)` | `var(--accent)` |
| anything else | `var(--surface-2)` | `var(--muted)` |

Apply in:
- `app/dashboard/overview/page.tsx` — recent calls table status badge
- `app/dashboard/call-logs/page.tsx` — call logs table status badge

---

## 3. Default Light Theme

**Problem:** Dashboard initialises in dark mode. User preference: light by default.

**Fix:** In `lib/theme.tsx`:
- Change `useState<Theme>('dark')` → `useState<Theme>('light')`
- Change `localStorage.getItem('theme') || 'dark'` → `localStorage.getItem('theme') || 'light'`

Users who previously saved a preference keep it (localStorage value takes precedence).

---

## 4. Total Minutes Hero Stat in Overview Header

**Problem:** The header area is underutilised — just a title and live dot.

**Design:** Replace the right side of the overview header with a prominent hero stat block:
- Large number: `stats.minutes` formatted with `toLocaleString()`, 36px Inter, color `#7c3aed`
- Label below: "total minutes", 12px, muted
- Live dot + "Live" text beside the number (moved from current position)

File: `app/dashboard/overview/page.tsx` — header `<div>` (lines ~128–138).

---

## 5. Appointments Kanban View

### Overview

A third view mode (`'kanban'`) alongside `'list'` and `'calendar'`. Four columns representing appointment statuses. Cards are drag-and-drop — dropping onto a column calls the existing `updateStatus(id, status)` function.

### View Toggle

Add `'kanban'` to the `viewMode` state type and the toggle button group. Button label: `<KanbanSquare size={13} /> Kanban` (Lucide icon).

### Columns

Four fixed columns in order:

| Column | Status value | Header color |
|---|---|---|
| Booked | `booked` | `#4f8ef7` (accent) |
| Completed | `completed` | `#10b981` (success) |
| Cancelled | `cancelled` | `#ef4444` (danger) |
| Rescheduled | `rescheduled` | `#f59e0b` (warning) |

### Card Content

Each card shows:
- Customer name (13px, font-weight 500)
- Service type (12px, muted)
- Scheduled date/time (11px, muted) using `formatDateTime()`
- Address snippet (11px, muted, truncated to 1 line)

Card style: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 8px`, `padding: 12px`, `margin-bottom: 8px`, `cursor: grab`.

### Drag-and-Drop

Use HTML5 native DnD — no new library:
- `draggable={true}` on each card
- `onDragStart`: store `appointment.id` in `event.dataTransfer`
- Column `div`: `onDragOver` (preventDefault to allow drop), `onDrop`: read id, call `updateStatus(id, columnStatus)`
- Visual feedback: `onDragOver` adds a highlight border on the column (`border-color: var(--accent)`)

### State

The Kanban view uses the `appointments` array directly (unfiltered) — all appointments are shown, grouped by their current status column. The search bar and status filter pills are hidden in kanban mode. The `filtered` array is only used by the list view.

### File

`app/dashboard/appointments/page.tsx` — add kanban branch to the view mode union type, add the KanbanSquare import, add the kanban JSX section.

---

## Files Changed

| File | Change |
|---|---|
| `lib/utils.ts` | Add `getCallStatusStyle()` helper |
| `lib/theme.tsx` | Default theme → `'light'` |
| `app/dashboard/call-logs/page.tsx` | Fix `cost` with `Number()`, apply `getCallStatusStyle()` |
| `app/dashboard/overview/page.tsx` | Hero minutes stat in header, apply `getCallStatusStyle()` to recent calls |
| `app/dashboard/appointments/page.tsx` | Add Kanban view with drag-and-drop |

---

## Out of Scope

- Drag-and-drop between Kanban and Calendar/List
- Kanban card detail expansion (use List view for that)
- Batch status updates
