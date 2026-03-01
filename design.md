# IB LMS Teacher Portal — UI System & Design Guidelines (Prototype)
Always evaluate this document when designing a feature and always use front-end design skill when implementing.

This document defines the **visual language, interaction philosophy, and reusable UI patterns** for a high‑fidelity **IB LMS teacher portal** prototype (frontend-only with mock data).  
Multiple coding agents should use this as a single reference so that every screen feels **native to the same platform**.

**Scope of this doc:** UI theme, UX principles, layout, components, states, accessibility, motion.  
**Out of scope:** feature requirements, workflows, business rules, data models.

---

## 1) Brand personality (locked)

**Mood:** Warm + human, calm + organized, professional but friendly.  
Teachers are time-poor; the UI should feel **supportive**, not demanding.

### Non‑negotiable UX principles
1. **Clarity over cleverness**
   - Default views should be scannable in **<10 seconds**.
2. **Low cognitive load**
   - Prefer progressive disclosure: summary → drilldown (drawer).
3. **Workflow-friendly**
   - Reduce context switching: keep key actions near the work surface (row actions, sticky toolbars).
4. **Coherence everywhere**
   - Same spacing, radii, typography, and component behaviors across modules.
5. **Accessible by default**
   - Keyboard navigable, visible focus, color never the only signal.

---

## 2) Theme system (tokens are the source of truth)

**Rule:** No hard-coded styles inside components. Components consume tokens only.

### 2.1 Color palette (Peach accent)
**Primary (Peach):** `#C24E3F`  
Use Peach for **brand emphasis** (primary buttons, active nav, selection outlines, focus ring).  
Do **not** use Peach for success/warning/error states (use semantic colors).

#### CSS variables
```css
:root {
  /* Neutrals */
  --bg: #ffffff;
  --bg-subtle: #f7f8fa;
  --surface: #ffffff;
  --surface-2: #fbfbfd;
  --border: #e6e8ee;

  --text: #111827;
  --text-muted: #6b7280;
  --text-subtle: #9ca3af;

  /* Peach accent scale */
  --primary-50:  #fff2f0;
  --primary-100: #ffe1dc;
  --primary-200: #ffc1b7;
  --primary-300: #f99a8b;
  --primary-400: #e56f5e;
  --primary-500: #d85a4a;
  --primary-600: #c24e3f; /* main */
  --primary-700: #a94336;
  --primary-800: #8a362b;
  --primary-900: #6d2a22;

  --primary: var(--primary-600);
  --primary-hover: var(--primary-700);
  --primary-soft: var(--primary-50);

  /* Semantic colors (stable, non-accent) */
  --success: #16a34a;
  --success-soft: #dcfce7;
  --warning: #f59e0b;
  --warning-soft: #fef3c7;
  --danger: #dc2626;
  --danger-soft: #fee2e2;
  --info: #2563eb;
  --info-soft: #dbeafe;

  /* Focus ring */
  --focus-ring: 0 0 0 3px rgba(194, 78, 63, 0.25);

  /* Elevation */
  --shadow-1: 0 1px 2px rgba(16, 24, 40, 0.06);
  --shadow-2: 0 10px 30px rgba(16, 24, 40, 0.10);

  /* Radii (Option B) */
  --r-sm: 10px;
  --r-md: 14px;
  --r-lg: 18px;

  /* Spacing (comfortable; 8pt base) */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 12px;
  --s-4: 16px;
  --s-5: 24px;
  --s-6: 32px;
  --s-7: 40px;

  /* Table density (Option B) */
  --row-h: 36px;
}
```

---

## 3) Typography (professional + friendly)

### Font family (locked)
**Primary:** Plus Jakarta Sans  
**Fallbacks:** Inter, ui-sans-serif, system-ui

**Implementation hint (Next.js):**
- Prefer `next/font/google` to avoid layout shift.

### Type scale (comfortable density)
- **H1:** 24px / 650 / 1.2
- **H2:** 18px / 650 / 1.3
- **H3:** 16px / 600 / 1.35
- **Body:** 14px / 450 / 1.5
- **Small:** 13px / 450 / 1.45
- **Micro/Label:** 12px / 500 / 1.35

### Content & microcopy tone
- Sentence case labels (“Create assessment”, not “CREATE ASSESSMENT”)
- Warm, concise, teacher-friendly:
  - “Nothing here yet” > “No data found”
  - “Try adjusting filters” > “Invalid filter”
- Buttons start with verbs: **Create, Save, Export, Send**

---

## 4) Iconography (locked)

**Icon set:** **Lucide** (outline style)  
Guidelines:
- 20px default for toolbar/row actions, 16px inside inputs, 24px for nav icons.
- Every icon-only button must have a tooltip and an accessible label.

---

## 5) Layout system (app shell)

### App chrome
- **Top bar:** 56px fixed
- **Left sidebar:** collapsible
  - Expanded: 280px (icon + label)
  - Collapsed: 72px (icon-only + tooltip)
- **Content max width:** 1240–1320px centered
- **Gutters:** 24px desktop, 16px tablet

### Standard page skeleton (use everywhere)
1. **Page header**
   - Title (H1)
   - Optional 1-line description
   - Exactly **one** primary action (right)
   - Secondary actions in overflow menu (“…”)
2. **Utility row** (optional)
   - Filters / segmented controls / search
3. **Main content**
   - Cards, tables, charts
4. **Right drawer**
   - Details/editing without losing context

---

## 6) Interaction language

### Navigation behavior
- Active nav item:
  - Left accent rail (4px Peach)
  - Subtle background tint (primary-50)
- Collapsed sidebar:
  - Icons only + tooltips on hover/focus
  - Active state remains visible (rail still shown)
- Motion: smooth width transition (180–220ms)

### Progressive disclosure
- Default screens stay clean.
- Deeper details and edits open in:
  - **Right Drawer** (preferred)
  - **Modal** only for quick confirmations or short forms

### Feedback rules
- Autosave surfaces: show “Saving…” → “Saved” near page title (subtle).
- Toasts:
  - Short, rare, non-stacking when possible.
- Persistent status (prototype mode, mock data resets):
  - Use banners (top of content area), not toasts.

---

## 7) Component styling rules (coherence toolkit)

> These are styling + behavior constraints. Engineering props/APIs can live elsewhere.

### 7.1 Surfaces (cards/panels)
- Default: `--surface` + 1px `--border` + radius `--r-md`
- Hover: elevate to `--shadow-1`; border slightly darker
- Avoid heavy shadows (calm UI)

### 7.2 Buttons
Variants:
- **Primary:** Peach background + white text (use `--primary`)
- **Secondary:** white background + neutral border
- **Ghost:** transparent (row actions, toolbars)
- **Danger:** semantic red only

Sizing:
- Default height 36px
- Use 44px only for rare hero CTAs

Rule:
- Exactly **one primary** action per region (page header, drawer footer).

### 7.3 Inputs
- Height 36px, radius `--r-sm`
- Focus: border `--primary` + `--focus-ring`
- Error: border `--danger` + helper text (no shaking)

### 7.4 Tables / grids (signature experience)
Visual:
- Sticky header row
- Row hover: subtle neutral tint
- Selected row: subtle tint + left indicator rail

Behavior:
- Row actions appear on hover (icon buttons + overflow “…”)
- Bulk selection:
  - checkbox column + bulk action bar
- Density (locked):
  - `--row-h: 36px`, compact text, generous whitespace around tables

### 7.5 Right Drawer (signature pattern)
- Width: 460–540px
- Header: title + status chip + close
- Body: scrollable
- Footer: sticky action row (primary + secondary)

Use drawer to preserve context. Teachers should not “lose their place.”

### 7.6 Chips / tags / pills
- Neutral by default (bordered)
- Semantic chips only when meaning is critical (Missing, Late, At‑risk)
- Keep copy 1–2 words

### 7.7 Charts & insights
- Charts are supportive, not the main UI.
- Always pair a chart with a one-line takeaway.
- Reserve Peach for “highlighted selection” rather than coloring everything Peach.

---

## 8) States & polish (prototype realism)

### Loading
- Prefer skeletons for tables/cards.
- Avoid spinners as the primary loading affordance.

### Empty states (locked: light illustrations)
Use **light, friendly illustrations** in empty states to add warmth, but keep them subtle:
- Monochrome or soft neutral with a small Peach accent
- Simple shapes; avoid busy scenes
- Always include:
  - Title + 1 sentence
  - A single clear CTA
  - Optional “Learn more” link (secondary)

### Errors
- Calm and specific:
  - “Couldn’t export (mock). Try again.”
- Avoid blamey language.

### Prototype badge
- Consider a small “Demo data” badge in the top bar.

---

## 9) Motion guidelines

- Easing: `cubic-bezier(0.2, 0, 0, 1)`
- Durations:
  - Hover/focus: 120–160ms
  - Drawer open/close: 180–240ms
  - Toast in/out: 200ms
- Motion supports continuity; never distracts.

---

## 10) Accessibility baseline (required)

- Visible focus for all interactive elements (`--focus-ring`)
- Full keyboard navigation:
  - Sidebar → top bar → content → drawer (with focus trap)
- Color is never the only indicator:
  - Use icons/labels for semantic states
- Contrast:
  - Primary button must be AA with white text (use `--primary-600` or darker)
- Icon-only buttons require tooltips + `aria-label`

---

## 11) Do / Don’t

### Do
- Keep default screens quiet and scannable
- Use one primary action per region
- Use the drawer pattern for deep work
- Keep tables consistent across modules
- Use Peach sparingly but consistently for brand emphasis

### Don’t
- Don’t invent one-off components per screen
- Don’t use Peach for warnings/errors/success
- Don’t overload toolbars with many competing actions
- Don’t create “BI dashboard” density—insights should remain actionable

---

## 12) “On-brand” checklist for any new screen

A screen is coherent if it:
- Uses the standard page header layout
- Uses tokens only (no hard-coded color/radius)
- Uses the drawer pattern for drilldown/editing
- Uses consistent table styling (sticky header + hover + row actions)
- Has loading + empty states
- Preserves calmness (no visual clutter)
