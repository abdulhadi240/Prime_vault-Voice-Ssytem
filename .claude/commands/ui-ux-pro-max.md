# UI/UX Pro Max

Design intelligence skill for building professional UI/UX across web and mobile. Use when designing new pages, creating UI components, selecting color/typography systems, reviewing code for UX quality, or implementing interaction patterns. Skip for pure backend, API design, or non-visual tasks.

## Workflow

### Step 1 — Analyze Requirements
Extract:
- Product type (Entertainment, Tool, Productivity, etc.)
- Target audience
- Style keywords
- Technology stack (react, nextjs, react-native, shadcn, vue, etc.)

### Step 2 — Select a Design System
Choose a coherent system aligned to product type. Define:
- Color palette (semantic tokens: primary, surface, border, muted, destructive)
- Typography pairing (display + body fonts; base 16px; 1.5 line-height)
- Icon set (consistent SVG — never emoji as UI controls; never mix filled and outline at same hierarchy)
- Spacing scale (4px base unit)

### Step 3 — Apply Domain-Specific Guidance
Reference the priority rules below for the relevant domain before writing code.

## Priority Rules (1–10)

| Priority | Category | Requirement |
|----------|----------|-------------|
| **1** | Accessibility | 4.5:1 contrast for normal text; visible focus rings; alt text on all images; full keyboard navigation |
| **2** | Touch & Interaction | Minimum 44×44px touch targets; 8px gap between targets; clear loading/error feedback within 80–150ms |
| **3** | Performance | WebP/AVIF images; lazy loading; reserve layout space (CLS < 0.1) |
| **4** | Style Selection | Match style to product type; consistent SVG icons; no emoji as UI controls |
| **5** | Layout & Responsive | Mobile-first breakpoints; viewport meta tag; no horizontal scroll |
| **6** | Typography & Color | Base 16px body; 1.5 line-height; semantic color tokens; 4.5:1 contrast |
| **7** | Animation | Duration 150–300ms; motion conveys meaning; respect `prefers-reduced-motion` |
| **8** | Forms & Feedback | Visible labels; inline errors near fields; helper text; progressive disclosure |
| **9** | Navigation | Predictable back behavior; ≤5 bottom nav items; deep linking support |
| **10** | Charts & Data | Legends visible; tooltips on interaction; accessible color palettes; alt-text tables |

## Hard Rules — Never Do

- Use emoji for structural icons (use SVG)
- Mix filled and outline icons at the same visual hierarchy
- Create touch targets smaller than 44×44pt without expanding the hit area
- Rely on color alone to convey meaning

## Always Do

- Respect safe areas (notch, gesture bar, status bar) on mobile
- Test in both light and dark mode independently — never invert light colors
- Provide semantic accessibility labels on all interactive elements
- Reserve space for async content to prevent layout shift

## Pre-Delivery Checklist

- [ ] No emoji icons; consistent SVG icon set used throughout
- [ ] Touch targets ≥44×44pt with 8px minimum gap
- [ ] 4.5:1 text contrast in both light and dark modes
- [ ] Safe areas respected for fixed UI elements
- [ ] `prefers-reduced-motion` respected
- [ ] Accessibility labels on all interactive elements
- [ ] Interaction feedback within 80–150ms
- [ ] Dark mode colors tested independently (not inverted from light)
