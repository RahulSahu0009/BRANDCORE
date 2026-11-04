# BRANDCORE — Design System

**Version:** 0.1.0 · **Authority:** This is the single source of truth for all BRANDCORE application UI.
**Direction:** Professional editorial B2B governance workspace. Calm, precise, evidence-first.
Not a generic AI chat UI and not a cinematic marketing page.

---

## 1. Visual Direction

BRANDCORE is a workspace for brand governance professionals. The visual language is:
- **Calm and precise** — no decorative animation, no gradient hero sections
- **Evidence-first** — findings, evidence links and review status are always visible
- **Editorial** — dense information presented clearly, not hidden behind cards
- **Trustworthy** — consistent, predictable, no surprises

Do not add a generic compliance score. Keep findings and evidence visible.

---

## 2. Color Tokens

```css
/* Canvas and surfaces */
--canvas:        #F5F7FA;
--surface:       #FFFFFF;
--surface-muted: #EEF2F6;

/* Navy (primary text and headings) */
--navy-950:      #142235;
--navy-800:      #203750;

/* Slate (secondary text and borders) */
--slate-700:     #42556B;
--slate-600:     #5C6D80;
--slate-500:     #718197;
--border:        #DCE3EA;

/* Teal (primary action, success, approved) */
--teal-700:      #147A72;
--teal-100:      #DDF3EF;

/* Amber (stale, warning) */
--amber-700:     #986000;
--amber-100:     #FFF1CC;

/* Red (error, rejected, invalid) */
--red-700:       #B42318;
--red-100:       #FEE4E2;

/* Green (valid, approved) */
--green-700:     #137547;
--green-100:     #DDF5E7;

/* Text */
--text-primary:   #162638;
--text-secondary: #5C6D80;

/* Focus */
--focus-ring:    #2563EB;
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
│  BRANDCORE                    [Workspace: Demo Brand] │  ← Top nav (navy-950 bg)
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│  Sidebar     │  Main content area                    │
│  (240px)     │  (flex-1, canvas bg)                  │
│              │                                       │
│  - Facts     │                                       │
│  - Content   │                                       │
│  - Review    │                                       │
│  - Releases  │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘
```

- Top nav: `navy-950` background, white text, workspace selector
- Sidebar: `surface` background, `border` right border, `slate-700` nav items
- Active nav item: `teal-100` background, `teal-700` text
- Main content: `canvas` background, 24px padding

---

## 6. Core Components

### Status Badge

Used for release status, finding severity and review decisions.

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| VALID / Approved | `green-100` | `green-700` | `green-700` |
| STALE | `amber-100` | `amber-700` | `amber-700` |
| REVOKED / Rejected | `red-100` | `red-700` | `red-700` |
| INVALID | `red-100` | `red-700` | `red-700` |
| Pending | `surface-muted` | `slate-700` | `border` |

Always include a text label alongside color. Never use color as the only signal.

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

### Button

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| Primary | `teal-700` | white | none |
| Secondary | `surface` | `slate-700` | `border` |
| Danger | `red-700` | white | none |
| Disabled | `surface-muted` | `slate-500` | `border` |

---

## 7. Component States

Every interactive component must have all applicable states:

| State | Visual Treatment |
|-------|-----------------|
| Default | As defined in component spec |
| Hover | Slightly darker background (5% darken) |
| Focus-visible | `focus-ring` (#2563EB) 2px outline, 2px offset |
| Disabled | `surface-muted` background, `slate-500` text, `not-allowed` cursor |
| Loading | Spinner or skeleton; no content shift |
| Empty | Descriptive empty state with action if applicable |
| Error | `red-100` background, `red-700` text, error icon, description |
| Success | `green-100` background, `green-700` text, success icon |

Every screen must have loading, empty, error and success states.

---

## 8. WCAG 2.2 AA Target

- All text meets 4.5:1 contrast ratio (3:1 for large text ≥18px or bold ≥14px).
- Every interactive element is keyboard accessible with visible focus indicator.
- Focus order follows visual reading order.
- No information conveyed by color alone — always include text labels.
- Form inputs have associated labels.
- Error messages identify the field and describe the error.

Verify with axe on the deployed build. Do not claim WCAG AA compliance until verified.

---

## 9. Responsive Behavior

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column; sidebar collapses to bottom nav or hamburger |
| Tablet | 640px–1024px | Sidebar 200px; main content flex-1 |
| Desktop | > 1024px | Sidebar 240px; main content flex-1; max-width 1280px centered |

---

## 10. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

No animation communicates a critical status change. Status changes are always communicated via text.

---

## 11. Performance Budget

| Metric | Target | Status |
|--------|--------|--------|
| Initial route JS | ≤ 170 KB compressed | NOT MEASURED |
| LCP (mobile) | ≤ 2.5 s | NOT MEASURED |
| INP (mobile) | ≤ 200 ms | NOT MEASURED |
| CLS (mobile) | ≤ 0.1 | NOT MEASURED |

Measure on the deployed build. If the JS budget is exceeded, document an ADR with justification.

---

## 12. What Not to Do

- No generic compliance score widget
- No elaborate onboarding animations
- No gradient hero sections
- No cinematic scroll effects
- No large UI component libraries without an ADR
- No separate color palette or component system per feature
- No dark mode in Round 2 (document as Round 3 if needed)
