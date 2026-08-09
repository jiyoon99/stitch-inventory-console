---
name: HALFBOOK Operations System
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
  on-surface-variant: '#3d4a42'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7a72'
  outline-variant: '#bccac0'
  surface-tint: '#006c4a'
  primary: '#006948'
  on-primary: '#ffffff'
  primary-container: '#00855d'
  on-primary-container: '#f5fff7'
  inverse-primary: '#68dba9'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#9b3e3b'
  on-tertiary: '#ffffff'
  tertiary-container: '#ba5551'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#85f8c4'
  primary-fixed-dim: '#68dba9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#005137'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#7f2928'
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
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  table-cell-padding: 12px 16px
---

## Brand & Style

The design system is engineered for high-velocity operational environments. It prioritizes **Functional Elegance**, moving away from decorative elements to focus entirely on data clarity and task completion. The aesthetic is a hybrid of **Minimalism** and **Corporate Modern**, utilizing a "Quiet UI" approach where the interface recedes to let order data and status indicators take center stage.

The target audience consists of logistics managers and fulfillment operators who require a tool that reduces cognitive load during 8-hour shifts. The emotional response should be one of **total control, reliability, and precision**. Every pixel serves a purpose, and whitespace is used strategically to group related data points without wasting screen real estate.

## Colors

The palette is anchored by a **Zinc and Slate neutral scale** to ensure a sophisticated, low-fatigue backdrop. The primary action color is a **Deep Emerald (#059669)**, chosen for its association with "Go" and "Success" in operational workflows.

Status colors are essential for this design system but are implemented with **muted backgrounds and high-contrast text** to prevent "Christmas tree effect" (visual overwhelm). 
- **Neutral (Slate 400):** For "Waiting" or "Draft" states.
- **Informative (Blue 500):** For "Preparing" or "In Progress".
- **Specialized (Violet 500):** For "Produced" to distinguish from the final "Shipped" state.
- **Success (Emerald 600):** For "Shipped" or "Completed".
- **Destructive (Red 500):** For "Cancelled" or "Error".

## Typography

This design system utilizes **Inter** for its exceptional legibility in UI environments and neutral character. A tight scale ensures that data-dense tables remain readable.

For technical data such as Order IDs, Tracking Numbers, and SKU codes, **JetBrains Mono** is introduced. This monospaced font prevents "character jumping" when numbers update and makes strings of alphanumeric text easier to parse at a glance. Headlines use a slight negative letter-spacing to maintain a compact, "engineered" look.

## Layout & Spacing

The layout follows a **Strict 4px Grid System**. Efficiency is the priority, so the design system uses a **Fluid-Fixed Hybrid Grid**: Sidebars are fixed at 240px, while the main content area expands to 100% width to maximize the horizontal space for multi-column data tables.

On desktop, the "Dashboard-First" approach uses a 12-column grid. On tablet, the grid shifts to 8 columns with sidebar collapsing into a drawer. For mobile, the view transitions to a single-column "Feed" layout where table rows become expandable cards. Use "Compact" vertical spacing (8px-12px) between form elements to reduce scrolling.

## Elevation & Depth

To maintain a clean, professional look, this design system avoids heavy shadows. Instead, it uses **Tonal Layers and Low-Contrast Outlines**:
- **Level 0 (Background):** Slate 50 (#f8fafc).
- **Level 1 (Cards/Containers):** Pure White (#ffffff) with a 1px border in Slate 200 (#e2e8f0). No shadow.
- **Level 2 (Dropdowns/Modals):** Pure White with a 1px border and a subtle, large-radius ambient shadow (0px 10px 15px -3px rgba(0,0,0,0.05)).

Active states and focus rings use the Primary Emerald color with a 2px offset to ensure accessibility without cluttering the layout.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a subtle modern touch that breaks the harshness of a purely data-driven grid without feeling "bubbly" or consumer-oriented. 
- **Small elements (Inputs, Buttons, Chips):** 4px (rounded-sm).
- **Large elements (Cards, Modals):** 8px (rounded-lg).
- **Speciality elements:** Status dots remain circular (full rounded) to act as clear signifiers.

## Components

### Data Tables
Tables are the heart of the design system. They must feature:
- **Sticky Headers:** Always visible during scroll.
- **Zebra Striping:** Very subtle (Slate 50) on even rows.
- **Inline Actions:** Buttons appear on row hover to reduce visual clutter.
- **Column Sorting:** Indicated by subtle Slate 400 arrows.

### Buttons & Inputs
- **Primary Button:** Solid Emerald 600 with white text.
- **Secondary Button:** White background, Slate 200 border, Slate 700 text.
- **Ghost Button:** No border, used for utility actions (e.g., "Export").
- **Inputs:** Minimalist with 1px border; focus state uses a 2px Emerald ring. Labels are always persistent (never placeholder-only).

### Chips (Status Badges)
Chips use a "Soft Fill" style: a 10% opacity background of the semantic color with 100% opacity text of the same color. This ensures they are distinct but don't compete with primary buttons.

### Summary Cards
Used at the top of pages for KPIs (e.g., "Total Orders"). These should have a "Border-Left" accent using the primary or semantic color to categorize the metric at a glance.