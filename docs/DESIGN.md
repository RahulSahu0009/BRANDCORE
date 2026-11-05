# BRANDCORE — Design System

**Version:** 0.3.0 · **Authority:** This is the single source of truth for all BRANDCORE application UI.
**Direction:** Refined editorial SaaS + forest-green identity + intelligent data presentation.
Professional editorial B2B governance workspace. Calm, precise, evidence-first.
Not a generic AI chat UI and not a cinematic marketing page.

**Design seed:** Forest-green editorial enterprise (recorded as ADR-010). Single canonical source — all UI work references only this document.

---

## 1. Visual Direction

BRANDCORE is a workspace for brand governance professionals. The visual language is:
- **Refined editorial SaaS** — clean, dense information presented clearly
- **Forest-green identity** — deep forest green primary accent, restrained emerald states
- **Evidence-first** — findings, evidence links and review status are always visible
- **Trustworthy** — consistent, predictable, no surprises

Light theme:
- Warm neutral background (`#F5F7FA`)
- Clean white surfaces (`#FFFFFF`)
- Deep forest-green primary accent (`#15803d`)
- Restrained emerald states
- Clear typography
- Soft, consistent borders
- Subtle depth

Dark theme:
- Deep charcoal/forest surfaces (`#0A0F17`)
- Multiple clearly distinguishable elevation levels
- Muted but readable secondary text
- Refined green accents (`#34D399`)
- Comfortable contrast

Do not overload the UI with:
- Neon effects
- Random gradients
- Excessive glassmorphism
- Excessive shadows
- Oversized headings
- Unnecessary charts
- Decorative elements without purpose

Every visual decision must improve usability, hierarchy or brand identity.

---

## 2. Color Tokens

```css
/* Canvas and surfaces */
--canvas:        #F5F7FA;
--canvas-dark:   #0A0F17;
--surface:       #FFFFFF;
--surface-dark:  #111827;
--surface-muted: #F1F5F9;
--surface-muted-dark: #1E293B;
--surface-elevated: #FFFFFF;
--surface-elevated-dark: #1F2937;

/* Brand (forest green primary) */
--green-700:     #15803d;
--green-100:     #DCFCE7;
--green-dark:    #34D399;

/* Slate (secondary text and borders) */
--slate-700:     #42556B;
--slate-600:     #5C6D80;
--slate-500:     #718197;
--slate-dark:    #94A3B8;

/* Border */
--border:        #DCE3EA;
--border-dark:   #334155;

/* Amber (stale, warning) */
--amber-700:     #986000;
--amber-100:     #FFF1CC;
--amber-dark:    #F0C674;

/* Red (error, rejected, invalid) */
--red-700:       #B42318;
--red-100:       #FEE4E2;
--red-dark:      #E87A6E;

/* Brand text (navy in light, neutral in dark) */
--brand-950:     #142235;
--brand-dark:    #F8FAFC;

/* Text */
--text-primary:   #162638;
--text-primary-dark: #F8FAFC;
--text-secondary: #5C6D80;
--text-secondary-dark: #94A3B8;

/* Focus ring */
--focus-ring:    #15803d;
```

**Contrast rule:** Check actual text/background contrast before shipping. Token names do not guarantee WCAG AA. Verify with a contrast checker.

---

## 3. Typography

**Font stack:** System UI font stack — `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

No custom web fonts in the initial build. Add a web font only via an ADR.

| Scale | Size | Weight | Use |
|-------|------|--------|-----|
| `text-xs` | 12px | 400 | Metadata, timestamps, labels |
| `text-sm` | 14px | 400 | Body text, table cells |
| `text-base` | 16px | 400 | Primary body text |
| `text-lg` | 18px | 600 | Section headings |
| `text-xl` | 20px | 700 | Page headings |
| `text-2xl` | 24px | 700 | Primary page title |

Minimum body text: 14px. Minimum metadata: 12px.

---

## 4. Spacing Tokens

Base unit: 4px.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Component internal padding |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard gaps |
| `space-6` | 24px | Section padding |
| `space-8` | 32px | Large section gaps |

Page padding: desktop 24px, tablet 16px, mobile 12–16px.

---

## 5. Navigation and Application Layout

```
┌─────────────────────────────────────────────────────┐
│  BRANDCORE                    [Workspace: Demo Brand] │  ← Top nav (surface bg, sticky)
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  Sidebar     │  Main content area                    │
│  (256px /    │  (flex-1, canvas bg, offset for       │
│   80px)      │   sidebar width)                      │
│              │                                       │
│  - Facts     │                                       │
│  - Content   │                                       │
│  - Releases  │                                       │
│  - Evidence  │                                       │
└──────────────┴──────────────────────────────────────┘
```

- Top nav: `surface` background, sticky, `border-b`, workspace context, theme toggle, Clerk auth controls
- Sidebar: `surface` background, `border-r`, collapsible (256px expanded / 80px collapsed), icon-only when collapsed with tooltips
- Active nav item: `bg-green-100` (light) / `bg-green-900/20` (dark), `text-green-700` (light) / `text-green-400` (dark)
- Main content: `canvas` background, padding offset for sidebar width (`pl-64` expanded / `pl-20` collapsed)
- Mobile: hamburger toggle opens overlay drawer with backdrop, escape-to-close, body scroll locked

**Sidebar collapse:** Preference persisted in `localStorage` under `brandcore-sidebar-collapsed`. No layout flash on init.

---

## 6. Stacking Context (z-index)

| Layer | z-index | Use |
|-------|---------|-----|
| Base content | 0 | Page content |
| Mobile hamburger | 30 | Fixed toggle button |
| Mobile backdrop | 30 | Drawer backdrop |
| Sidebar | 20 | Fixed sidebar |
| Top bar | 30 | Sticky header (above sidebar) |
| Modals/dialogs | 50 | Overlay dialogs |
| Drawer (mobile) | 40 | Mobile navigation drawer |

Do not use arbitrary `z-index: 9999`. Use the established layers above.

---

## 7. Core Components

### Status Badge

Used for release status, finding severity and review decisions.

| Status | Light BG | Light Text | Dark BG | Dark Text |
|--------|----------|------------|---------|-----------|
| VALID / Approved | `bg-green-100` | `text-green-700` | `bg-green-900/20` | `text-green-400` |
| STALE | `bg-amber-100` | `text-amber-700` | `bg-amber-900/20` | `text-amber-400` |
| REVOKED / Rejected | `bg-red-100` | `text-red-700` | `bg-red-900/20` | `text-red-400` |
| INVALID | `bg-red-100` | `text-red-700` | `bg-red-900/20` | `text-red-400` |
| Pending | `bg-surface-muted` | `text-slate-700` | `bg-surface-muted` | `text-slate-500` |

Always include a text label alongside color. Never use color as the only signal.

### Button

| Variant | Background | Text | Hover | Focus |
|---------|-----------|------|-------|-------|
| Primary | `bg-green-700` | white | `bg-green-800` | `ring-green-700` |
| Secondary | `bg-surface` | `text-text-primary` | `bg-surface-muted` | `ring-slate-700` |
| Danger | `bg-red-700` | white | `bg-red-800` | `ring-red-700` |
| Ghost | transparent | `text-text-secondary` | `bg-surface-muted` | `ring-slate-700` |

### Finding Card

```
┌─────────────────────────────────────────────────────┐
│  [Finding Type Badge]  Unsupported claim             │
│  ─────────────────────────────────────────────────  │
│  Affected text: "Our product reduces costs by 40%"  │
│  Reason: No approved evidence reference found        │
│  Evidence: —                                         │
│  Suggestion: Add evidence reference or qualify claim │
└─────────────────────────────────────────────────────┘
```

---

## 8. Component States

Every interactive component must have all applicable states:

| State | Visual Treatment |
|-------|-----------------|
| Default | As defined in component spec |
| Hover | Slightly darker background (5% darken) |
| Focus-visible | `focus-ring` (#15803d) 2px outline, 2px offset |
| Disabled | `opacity-50`, `pointer-events-none`, `cursor-not-allowed` |
| Loading | Spinner or skeleton; no content shift |
| Empty | Descriptive empty state with action if applicable |
| Error | `border-red-100`/`dark:border-red-800/30`, `bg-red-50`/`dark:bg-red-900/20`, error icon, description |
| Success | `bg-green-100`/`dark:bg-green-900/20`, `text-green-700`/`dark:text-green-400`, success icon |

Every screen must have loading, empty, error and success states.

---

## 9. WCAG 2.2 AA Target

- All text meets 4.5:1 contrast ratio (3:1 for large text ≥18px or bold ≥14px).
- Every interactive element is keyboard accessible with visible focus indicator.
- Focus order follows visual reading order.
- No information conveyed by color alone — always include text labels.
- Form inputs have associated labels.
- Error messages identify the field and describe the error.
- Sidebar toggle has `aria-expanded`, `aria-controls`, accessible name, keyboard support.
- Mobile drawer has Escape-to-close, backdrop click, focus management, body scroll lock.

Verify with axe on the deployed build. Do not claim WCAG AA compliance until verified.

---

## 10. Responsive Behavior

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 768px | Single column; hamburger toggle opens overlay drawer; sidebar hidden |
| Tablet | 768px–1024px | Sidebar 256px; main content flex-1 |
| Desktop | > 1024px | Sidebar 256px; main content flex-1 |

Sidebar collapsed width: 80px (icon only, tooltips on hover).

---

## 11. Dark Mode

- **Theme provider:** Centralized `ThemeProvider` with class-based dark mode (`dark` class on `document.documentElement`)
- **Persistence:** `localStorage` key `brandcore-theme`
- **System preference:** `prefers-color-scheme` respected when no manual preference
- **Initialization:** Theme applied before UI renders via `ThemeProvider` — no flash of incorrect theme
- **Theme toggle:** Working toggle in main navigation (TopBar)
- **Consistency:** Dark mode applied across every page, dialog, dropdown, and Clerk component
- **No CSS inversion:** Semantic tokens used, not `invert()` or `filter`

---

## 12. Motion Rules

- All transitions and animations use `ease-out` or `ease-in-out` timing
- Sidebar collapse/expand: `duration-300 ease-in-out` on width and transform
- Mobile drawer slide: `duration-300 ease-in-out` on transform
- Fade-in for page content: `duration-200 ease-out`
- No animated backgrounds, marquee text, or decorative motion
- **`prefers-reduced-motion: reduce`:** All animations and transitions are reduced to 0.01ms duration (see `src/styles.css`)

---

## 13. Authentication UI States

| Auth state | UI behavior |
|------------|-------------|
| Clerk loading | "Signing in…" state, no API calls |
| Signed out | Sign-in / Sign up buttons shown |
| Signed in, no org | "No active organization" state, select org via Clerk |
| Signed in, org no workspace | "No workspace access" state |
| Authenticated, workspace ready | Full application with workspace data |
| 401 response | "Session expired. Please sign in again." — no silent demo fallback |
| 403 response | "You do not have access to this workspace." — no silent demo fallback |

Demo mode (backend endpoints unavailable but auth valid): Clearly labeled amber banner, fictional data, no changes persisted.

---

## 14. API Loading and Error States

| API result | UI behavior |
|------------|-------------|
| Loading | Skeleton or progress indicator |
| 200 | Display actual returned data |
| Empty result | Contextual empty state |
| 401 | Sign-in / session-expired state |
| 403 | Access denied |
| 404 | Resource not found |
| 422 | Validation errors |
| 500 | Recoverable service error and retry |

Prevent duplicate requests caused by repeated component renders. Do not hide backend failures. Do not silently replace live data with mocks.

---

## 15. Performance Budget

| Metric | Target | Status |
|--------|--------|--------|
| Initial route JS | ≤ 170 KB compressed | NOT MEASURED |
| LCP (mobile) | ≤ 2.5 s | NOT MEASURED |
| INP (mobile) | ≤ 200 ms | NOT MEASURED |
| CLS (mobile) | ≤ 0.1 | NOT MEASURED |

Measure on the deployed build. If the JS budget is exceeded, document an ADR with justification.

---

## 16. What Not to Do

- No generic compliance score widget
- No elaborate onboarding animations
- No gradient hero sections
- No cinematic scroll effects
- No large UI component libraries without an ADR
- No separate color palette or component system per feature
- No `z-index: 9999` — use established stacking layers
- No hardcoded workspace IDs (`ws_demo`) — workspace resolved from Clerk org context
- No silent demo fallback on auth errors (401/403)

---

## 17. Component Ownership

- **Shared design system:** All components in `src/components/ui/` and `src/components/layout/`
- **Sidebar and application shell:** Shared, used by all pages
- **Theme architecture:** Shared `ThemeProvider`, `ThemeToggle`
- **Content Review (Rahul):** May redesign page layouts, introduce new components, improve forms/modals within shared design system
- **Brand Governance and Release Governance (Arvind):** May redesign page layouts, introduce new components, improve forms/modals within shared design system

Rahul and Arvind have creative freedom within their assigned screens. Do not overwrite their changes or duplicate their work.
