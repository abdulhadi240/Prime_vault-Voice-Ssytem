# Batch 3: Payment Cards + Calendar Hover Preview — Design Spec

**Date:** 2026-04-26  
**Status:** Approved

## Goal

Add two UI-only minute plan purchase cards to the Settings page, and add a floating hover detail card to calendar appointment chips in the Appointments page.

---

## 1. Payment Cards in Settings

### Location

New `Section` block titled **"Minutes Plans"** inserted between the existing "Business Information" and "API Keys" sections in `app/dashboard/settings/page.tsx`.

### Cards

Two side-by-side plan cards rendered using the existing `.stat-card` CSS class:

| Field | Starter | Pro |
|---|---|---|
| Plan name | Starter | Pro |
| Minutes | 100 min | 1,000 min |
| Price | $30 | $300 |
| Description | "Great for small teams getting started with AI calling" | "Best value for growing businesses with high call volume" |
| Badge | — | "Best Value" (accent color, top-right of card) |

### Layout

Two cards displayed side by side: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`. Each card:
- Plan name (12px, muted, uppercase, letter-spacing)
- Price: large number (`$30` / `$300`) at 32px, bold, `color: var(--text)`
- Description text (13px, muted)
- "Purchase" button (`btn-primary` class, full width, margin-top: auto)

### Interaction

- New state: `purchasedPlan: 'starter' | 'pro' | null` — initialised to `null`
- Clicking "Purchase" sets `purchasedPlan` to the plan key (`'starter'` or `'pro'`)
- A `setTimeout` of 4000ms resets `purchasedPlan` to `null`
- When `purchasedPlan === planKey`: the button is replaced by an inline message:
  ```
  Coming soon — contact us at contact@zentrexsystems.com
  ```
  (12px, muted color, centered)
- The email `contact@zentrexsystems.com` is hardcoded (matches the `businessEmail` default already in the file)

### File

`app/dashboard/settings/page.tsx` — add state, add the Minutes Plans section between Business Information and API Keys.

---

## 2. Calendar Appointment Hover Preview

### Location

`app/dashboard/appointments/page.tsx` — calendar view only. No changes to list or kanban views.

### State

Two new state variables added to the component:
```tsx
const [hoveredAppt, setHoveredAppt] = useState<Appointment | null>(null);
const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
```

### Trigger

On each appointment chip inside the calendar day cells, add:
```tsx
onMouseEnter={e => { setHoveredAppt(a); setHoverPos({ x: e.clientX, y: e.clientY }); }}
onMouseLeave={() => setHoveredAppt(null)}
```

### Popover

A `position: fixed` div rendered at the root of the calendar JSX section (outside the day grid), shown only when `hoveredAppt !== null`:

```
position: fixed
top: hoverPos.y
left: hoverPos.x + 16
width: 220px
z-index: 200
pointer-events: none
background: var(--surface)
border: 1px solid var(--border)
border-radius: 10px
padding: 14px 16px
box-shadow: var(--shadow)
```

### Popover Content

```
[Customer name]          [Status badge]
[Service type]           — 12px muted
[formatDateTime(scheduled_start)]  — 12px muted
[Address]                — 12px muted, if present
[Issue description]      — 12px muted, 2-line clamp, if present
```

- Customer name: `(a as any).customers?.name || 'Unknown'`, 13px, fontWeight 500
- Status badge: `<span className={`badge ${getStatusColor(a.status)}`} style={{ fontSize: 10 }}>`
- Top row is flex `space-between`
- No close button (popover is mouse-driven, `pointer-events: none`)

### File

`app/dashboard/appointments/page.tsx` — add two state vars, add `onMouseEnter`/`onMouseLeave` to calendar chips, add popover div.

---

## Files Changed

| File | Change |
|---|---|
| `app/dashboard/settings/page.tsx` | Add `purchasedPlan` state, add Minutes Plans section |
| `app/dashboard/appointments/page.tsx` | Add `hoveredAppt`/`hoverPos` state, add hover handlers to calendar chips, add popover |

---

## Out of Scope

- Actual payment processing or Stripe integration
- Hover preview in list or kanban views
- Popover repositioning to avoid viewport edge clipping
- Persisting plan selection
