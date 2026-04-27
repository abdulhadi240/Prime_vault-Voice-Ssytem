# Batch 2: Collapsible Sidebar + Premium Polish — Design Spec

**Date:** 2026-04-26  
**Status:** Approved

## Goal

Add a collapsible sidebar (icon-only mode), move the theme toggle to the sidebar bottom, apply a premium color palette update across both themes, and wrap the minutes hero stat in a styled pill.

---

## 1. Collapsible Sidebar

### Behavior

- **State:** `sidebarCollapsed: boolean` added to `DashboardLayout` via `useState(false)`
- **Expanded:** `width: 224px` — current layout unchanged
- **Collapsed:** `width: 64px` — icon-only, labels hidden
- **Transition:** `transition: 'width 0.25s ease'` on the `<aside>` and matching `transition` on `<main>` `marginLeft`
- **Persistence:** Not persisted — always starts expanded on page load

### Toggle Button

- Placed at the top of the sidebar, in the logo row, replacing the current theme button position
- Icon: `<ChevronLeft size={16} />` when expanded, `<ChevronRight size={16} />` when collapsed
- Clicking toggles `sidebarCollapsed`

### Collapsed State Details

| Element | Expanded | Collapsed |
|---|---|---|
| Logo text + "Command Center" label | Visible | `opacity: 0; width: 0; overflow: hidden` |
| Nav item labels | Visible | `opacity: 0; width: 0; overflow: hidden` |
| Nav icons | Left-aligned with label | Centered in 64px column |
| Nav links | `title` attribute not required | `title={item.label}` — native browser tooltip |
| Live badge row | Visible | Hidden (`display: none` when collapsed) |
| User avatar circle | Visible | Visible (centered in 64px column) |
| User email | Visible | Hidden (`opacity: 0; width: 0`) |
| Sign-out button text | Visible | Hidden — `<LogOut>` icon only, centered |
| Theme toggle | Bottom of sidebar (see §2) | Icon only, centered |

### Main Content

- `<main>` `marginLeft`: `sidebarCollapsed ? 64 : 224`
- Same `transition: 'margin-left 0.25s ease'`

### Mobile

- Collapsed state only applies at ≥ 769px (desktop)
- Mobile open/close via overlay is unchanged
- On mobile, `sidebarCollapsed` has no effect (sidebar is always off-screen until `open` class is added)

---

## 2. Theme Toggle — Move to Sidebar Bottom

### Change

- **Remove** `{themeBtn}` from the sidebar logo row header
- **Add** theme toggle to the bottom user section, between the user email row and the sign-out button
- Layout when expanded: full 32×32 button with Sun/Moon icon, left-aligned
- Layout when collapsed: icon centered in the 64px column, same size

### Mobile Top Bar

- Mobile top bar keeps its own independent theme toggle button — unchanged

---

## 3. Premium Color Polish

### File: `app/globals.css`

**Light mode token updates:**

| Token | Before | After |
|---|---|---|
| `--bg` | `#f4f6fb` | `#f0f2f8` |
| `--surface-2` | `#f0f2f7` | `#e8ecf4` |
| `--border` | `#e2e6ef` | `#dde2ee` |
| `--shadow` | `0 2px 12px rgba(0,0,0,0.08)` | `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.07)` |

**Dark mode token updates:**

| Token | Before | After |
|---|---|---|
| `--surface` | `#111318` | `#13151d` |
| `--surface-2` | `#181c24` | `#1a1e2a` |
| `--shadow` | `0 2px 12px rgba(0,0,0,0.4)` | `0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)` |

**Stat card accent stripe (`globals.css`):**

Add `border-top: 2px solid` with `color-mix(in srgb, var(--accent) 30%, transparent)` to `.stat-card`. This gives each card a fine accent stripe at the top. If `color-mix` has compatibility concerns, use `rgba(79,142,247,0.30)` as a hardcoded fallback.

### File: `app/dashboard/layout.tsx`

**Sidebar gradient:** Replace flat `background: 'var(--surface)'` with:
```
background: 'linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%)'
```

---

## 4. Minutes Hero Pill (Overview Header)

### File: `app/dashboard/overview/page.tsx`

Wrap the existing minutes number + label in a styled pill container:

```
background: var(--accent-dim)
border: 1px solid rgba(79,142,247,0.30)   /* accent at 30% */
border-radius: 16px
padding: 12px 20px
```

The large purple number (`fontSize: 36, color: '#7c3aed'`) and "total minutes" label (`fontSize: 12, color: 'var(--muted)'`) remain inside. The pill sits on the right side of the overview header, with the Live indicator adjacent to it (unchanged).

---

## Files Changed

| File | Change |
|---|---|
| `app/dashboard/layout.tsx` | Collapsible sidebar state + toggle, theme toggle move, sidebar gradient |
| `app/globals.css` | Premium color token updates, stat card accent stripe |
| `app/dashboard/overview/page.tsx` | Minutes hero pill wrapper |

---

## Out of Scope

- Persisting sidebar collapsed state to localStorage
- Animated label fade (opacity transition only — no height animation)
- Changing nav icon sizes
- Any changes to Calendar, Call Logs, Customers, Settings, or Appointments pages
