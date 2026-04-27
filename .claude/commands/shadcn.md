# shadcn/ui Skill

Expert guidance for building with shadcn/ui components. Use when adding, composing, or styling shadcn components in a project.

## Core Principles

1. **Leverage existing components** — search the registry before creating custom UI
2. **Compose, don't reinvent** — e.g., a settings page = Tabs + Card + form controls
3. **Use built-in variants** (`variant="outline"`, `size="sm"`) before custom styling
4. **Semantic colors** — use `bg-primary`, `text-muted-foreground`, never raw hex values

## Workflow

1. Run `npx shadcn@latest info --json` to get project context (aliases, tailwindVersion, isRSC, iconLibrary, packageManager)
2. Check installed components before adding new ones
3. Use `npx shadcn@latest search` to find components in the registry
4. Run `npx shadcn@latest docs <component>` for documentation
5. Preview with `--dry-run` and `--diff` before installing
6. Fix any third-party registry imports to match project `aliases`
7. When the registry source is unspecified, ask the user which to use

## Styling Rules

- Use `className` for layout adjustments — never override component colors directly
- Replace `space-x-*` / `space-y-*` with `flex gap-*`
- Use `size-*` when `width` and `height` are equal
- Use `truncate` instead of manually setting overflow properties
- Use `cn()` for conditional class merging
- Never manually set `z-index` on overlay components

## Form & Input Rules

- Use `FieldGroup` + `Field` for form layout — never raw `div`
- Use `InputGroup` with `InputGroupInput` / `InputGroupTextarea`
- Use `ToggleGroup` for 2–7 option sets
- Use `FieldSet` + `FieldLegend` for grouped checkboxes/radios
- Implement validation with `data-invalid` on `Field` and `aria-invalid` on controls

## Component Structure Rules

- Keep items inside their groups (`SelectItem` → `SelectGroup`)
- Use `asChild` (Radix) or `render` (base) for custom triggers
- Always include a title in Dialog, Sheet, Drawer (required for accessibility)
- Always provide `AvatarFallback` for Avatar components
- Keep `TabsTrigger` inside `TabsList`

## Icon Rules

- Use `data-icon` attribute on icons inside buttons
- Never apply sizing classes to component-embedded icons
- Pass icons as objects, not string keys

## Key Project Context Fields

| Field | Meaning |
|-------|---------|
| `aliases` | Import path prefixes — always use these, never hardcode |
| `isRSC` | Whether to add `"use client"` directives |
| `tailwindVersion` | v3 vs v4 — affects CSS variable syntax |
| `base` | Primitive library: `radix` or `base` |
| `iconLibrary` | Icon source: `lucide-react`, `@tabler/icons-react`, etc. |
| `packageManager` | Use for non-shadcn installs |

## Common Commands

```bash
npx shadcn@latest init --name my-app --preset base-nova
npx shadcn@latest add button card dialog
npx shadcn@latest add --dry-run
npx shadcn@latest search @shadcn -q "sidebar"
npx shadcn@latest docs button
```

## Component Selection Guide

| Use case | Component |
|----------|-----------|
| Actions | Button |
| Text input | Input, Textarea |
| Selection | Select, Combobox |
| 2–5 options | ToggleGroup |
| Data display | Table, Card, Badge |
| Overlays | Dialog, Sheet, Drawer |
| Navigation | Sidebar, NavigationMenu |
