---
name: Precision Logistics System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-performance inventory environments where clarity, speed, and reliability are paramount. The brand personality is **Professional, Analytical, and Dependable**, catering to operations managers and data analysts who require a "source of truth" for complex logistics.

The visual style follows a **Modern Corporate** approach with a focus on **Systematic Minimalism**. It prioritizes high data density without sacrificing legibility. By utilizing a "clean-room" aesthetic—characterized by ample whitespace, disciplined alignment, and a sophisticated cool-toned palette—the design system reduces cognitive load during high-intensity data entry and monitoring tasks.

## Colors

This design system utilizes a foundation of deep Slate and Indigo to establish authority and stability.

- **Primary:** `Slate-900` (#0F172A) is used for core navigation, headings, and high-emphasis interface anchors.
- **Secondary:** `Blue-500` (#3B82F6) serves as the primary action color, used for buttons, active states, and focus indicators.
- **Neutrals:** A vast range of cool grays (`Slate` palette) provides the structure for backgrounds, borders, and secondary text.
- **Semantic Accents:** Vibrancy is reserved for status signaling. Success (Green), Warning (Amber), and Error (Red) use high-saturation tokens to ensure they stand out immediately against the neutral data tables.

## Typography

The typography system relies on **Inter**, chosen for its exceptional tall x-height and legibility in small-scale data environments. 

- **Numerical Clarity:** For SKU numbers, quantities, and price points, utilize the `mono-data` token or enable tabular lining OpenType features in Inter to ensure digits align vertically in tables.
- **Hierarchy:** Use `label-md` for table headers and section titles to provide a clear structural anchor.
- **Mobile scaling:** For smaller viewports, `display` text should downscale to `headline-lg` proportions to maintain screen real estate for data tables.

## Layout & Spacing

This design system employs a **Fluid Grid** model based on a 4px baseline increment. 

- **Desktop:** 12-column grid with 24px outer margins and 16px gutters.
- **Tablet:** 8-column grid with 16px margins.
- **Mobile:** 4-column grid with 16px margins.

The spacing philosophy emphasizes "Zonal Grouping." Use `md` (16px) for internal card padding and `lg` (24px) to separate major interface sections. Tables should utilize a "Compact" or "Comfortable" toggle, with row heights alternating between 40px and 56px depending on the data density requirements of the specific workflow.

## Elevation & Depth

To maintain a clean, data-first look, the design system uses **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** `Slate-50` (#F8FAFC) - The canvas.
- **Level 1 (Cards/Tables):** White (#FFFFFF) with a 1px border in `Slate-200`. No shadow.
- **Level 2 (Overlays/Dropdowns):** White (#FFFFFF) with a soft, diffused shadow: `0px 4px 12px rgba(15, 23, 42, 0.08)`.
- **Level 3 (Modals):** White (#FFFFFF) with a deeper shadow: `0px 12px 32px rgba(15, 23, 42, 0.12)`.

This creates a "flat-stack" appearance that feels modern and prevents the UI from feeling cluttered when displaying thousands of data points.

## Shapes

The design system uses a **Soft (0.25rem)** roundedness logic. This creates a professional, disciplined appearance that feels more modern than sharp edges but more serious than fully rounded UI.

- **Standard Buttons & Inputs:** 4px (0.25rem) radius.
- **Cards & Modals:** 8px (0.5rem) radius.
- **Status Pills/Badges:** 9999px (Pill-shaped) to distinguish them from interactive buttons.

## Components

### Tables
The core of the system. Headers must be "sticky" during scroll. Use `Slate-50` for header backgrounds and `Slate-200` for 1px horizontal dividers. Hover states on rows should use `Slate-50`.

### Buttons
- **Primary:** Filled `Blue-500` with white text.
- **Secondary:** Outlined `Slate-200` with `Slate-900` text.
- **Destructive:** Filled `Red-500` for critical deletions.

### Input Fields
Use a 1px `Slate-300` border. On focus, transition the border to `Blue-500` and add a 2px blue ring with 20% opacity. Labels must always be visible (never use placeholder-only labels).

### Status Badges
Small, pill-shaped indicators.
- **In Stock:** Light green background, dark green text.
- **Low Stock:** Light amber background, dark amber text.
- **Out of Stock:** Light red background, dark red text.

### Metrics Cards
Positioned at the top of dashboards. Use `headline-lg` for the primary value and `body-sm` for the trend indicator (e.g., "+12% from last month"). Include a small sparkline graph where historical context is needed.