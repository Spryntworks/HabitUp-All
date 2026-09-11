# 🎨 HabitUp Design System & Impeccable Design Standards

This document establishes the official design specification, token architecture, and UX criteria for **HabitUp**, crafted in accordance with the **[Impeccable Design Methodology](https://impeccable.style/)**.

---

## 1. 📐 The 7 Impeccable Skill Domains

### 1.1 Typography & Vertical Rhythm
- **Primary Display Font**: System Sans (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`).
- **Heading Scale**:
  - `Hero Display`: 48px / Weight 900 / Tracking -1px
  - `Screen Title`: 24px / Weight 900 / Tracking -0.5px
  - `Section Header`: 17px / Weight 800 / Tracking -0.3px
  - `Metric Label / Badge`: 11–12px / Weight 800 / Uppercase / Tracking +0.8px
- **Body & Captions**:
  - `Body Regular`: 14–15px / Weight 500 / Line Height 1.4
  - `Subtitles & Helpers`: 12–13px / Weight 500 / High Contrast

### 1.2 Color Architecture & Contrast
- **WCAG AA / AAA Certified Palettes**:
  - **Dark Theme (Default)**: `#080E1A` (Canvas), `#0B1120` (Surface), `#121B2D` (Card), `#1E293B` (Elevated Track)
  - **Light Theme**: `#F8FAFC` (Canvas), `#FFFFFF` (Surface Card), `#F1F5F9` (Pill Track)
  - **Primary Accent**: `#7C5CFF` (Electric Violet)
  - **Success / Completed**: `#10B981` (Emerald Green)
  - **Streaks & Momentum**: `#F59E0B` / `#FF6B00` (Flame Amber / Solar Orange)
  - **Danger / Missed**: `#EF4444` / `#F43F5E` (Coral Crimson)
  - **Social / Buddy**: `#818CF8` / `#0EA5E9` (Sky Azure / Indigo)

### 1.3 Partial Status Dual-Tone Standard
- **Critique Rule**: Days or periods with partial habit completion must combine **Green** (completed) and **Red** (missed) rather than ambiguous single shades.
- **Implementation**: 45° LinearGradient `['#10B981', '#10B981', '#EF4444', '#EF4444']` across CalendarView matrix, DateStrip status dots, and streak history badges.

### 1.4 Spatial Rhythm & Elevation
- **Grid Unit**: 4px base / 8px component rhythm (Padding: 12px, 16px, 20px, 24px).
- **Border Radii**:
  - Small pills & badges: `20px` / `9999px`
  - Cards & modals: `16px` – `20px`
  - Floating action buttons: `28px`
- **Touch Target Ergonomics**: Minimum interactive area `44px × 44px` on mobile screens.

### 1.5 Motion, Haptics & Sensory Feedback
- **Living Mascot Animation**: Organic continuous sway (`±3°`), pulse breathing (`0.98` – `1.03`), and floating dynamics (`±4px`) on the terracotta plant.
- **Acoustic Feedback**: Web Audio API oscillator synthesis chime (`587.33Hz D5` -> `880Hz A5`) on habit check-ins and test triggers.
- **Tactile Feedback**: Expo Haptics medium impact triggers on check-in toggles.

### 1.6 UX Copywriting & Microcopy
- **Action-Oriented Tone**: Active, encouraging verbs ("Complete habit", "Nudge buddy", "Water garden").
- **Empty States**: Clear next steps with 1-tap template starter actions instead of dead ends.
- **Celebratory Milestones**: Explicit streak counts and plant stage evolution names ("Stage 4: Flourishing Oak").

### 1.7 Production Hygiene & Background Ergonomics
- **Firebase Cloud Messaging (FCM)**: Native device token registration, background OS delivery, and lockscreen interaction handlers.
- **Zero Technical Debt**: Fully strict TypeScript compilation with 0 compiler errors (`npx tsc --noEmit`).
