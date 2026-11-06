# Design

> Source of truth for typography, color, motion, layout, and component tokens.
> Read this BEFORE touching the UI. `AGENTS.md` section 5 takes precedence on any conflict.

## Aesthetic direction

Uiverse Galaxy: dark, calm surfaces with one indigo-purple-pink gradient reserved for the single primary action per view.

## Type stack

- Family: Plus Jakarta Sans Variable, bundled through `@fontsource-variable/plus-jakarta-sans` and imported only in the Options, Popup and Standalone entry points.
- Content overlay: no font is injected into host pages. It falls back to `ui-sans-serif, system-ui`.
- Minimum size: 12px (`text-xs`).

## Color tokens

- All colors come from `--c-<palette>-<shade>` in `src/styles/index.css`, used through Tailwind (`bg-slate-900`, `text-indigo-400`).
- Theme switches by inverting the palette under `[data-engchat-theme='light']`. Write one set of classes and never branch on `isLight`.
- Set `data-engchat-theme={theme}` on the root of every overlay surface. Inside Shadow DOM there is no `:root` theme to inherit.
- Surfaces: page `slate-950`, card and overlay `slate-900` (white in light theme), hover `slate-800`, border `slate-800` or `slate-700`.
- Text: `slate-100` primary, `slate-300` secondary, `slate-400` muted. `slate-500` fails AA for small text, so do not use it for text.
- Accent: `indigo-400` for icons, `indigo-500/15` for selected fills.
- Primary and danger buttons carry `data-engchat-theme="dark"` so white text stays above 4.5:1 in light theme.

## Shadows

Tint toward the page hue: `shadow-[0_20px_60px_rgb(2_6_23/0.4)]`. No colored glows and no pure black.

## Motion

- `animate-fadeIn` for page changes and `animate-popIn` for overlays and menus, both `cubic-bezier(0.16, 1, 0.3, 1)` under 200ms.
- Prefer `transition-colors`. `prefers-reduced-motion` is handled globally in `index.css`.

## Layout

- Options: `max-w-5xl`, flat sections separated by `border-t`. No card inside a card.
- Save bar: sticky at the bottom, reports unsaved, saved and failed states in one place. Hidden on pages that apply changes at once.
- Overlay: one scroll area in the popup body. Never use `fixed` and `relative` together, the later rule wins and the surface leaves the viewport.

## Component inventory

`src/components/ui/`: Alert, Badge, Button, Chip, IconButton, Input (`variant="bare"` for embedded fields), Loader, Logo, Menu, MenuItem, SelectCard, Select, Switch, Textarea, ToneCard, plus `useDismiss` and `useEscape`.

Raw `<button>` and `<input>` are allowed only inside these components. `NavLink` and external `<a>` are the only other interactive elements.

## Project-specific bans

- No emoji or text glyphs as icons. Use `lucide-react`.
- No hard-coded UI strings. Every string lives in `src/i18n/en.json` and `vi.json`, and a test keeps the two in sync.
- No duplicate save buttons or stacked success messages.

## Brand voice

Short and concrete. Avoid doubled jargon such as "AI Provider (LLM Provider)". Buttons name the action.

## Accessibility floor

- WCAG 2.2 AA contrast in both themes, checked on the rendered tokens.
- `:focus-visible` ring on every interactive element.
- Escape closes the innermost layer first. Menus support arrow keys, the toolbar supports left and right arrows.
- The overlay does not move focus on open, so the selection in the host page survives. Results announce through `aria-live`.

## Last updated

2026-11-06: UI/UX audit, shared palette theming, standard overlay components, unsaved-changes tracking.
