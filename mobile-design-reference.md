# Dewasi Group Mobile Design Reference

> **Source of Truth**: Extracted directly from the live Web application (`apps/web/app/[locale]/globals.css`, `packages/shared/src/theme.ts`, `apps/web/components/Header.tsx`, `apps/web/app/[locale]/login/page.tsx`, `apps/web/app/[locale]/doctor/dashboard/page.tsx`, and `apps/web/components/DoctorGrid.tsx`).

---

## 1. Brand & Identity

- **Platform Name**: Dewasi Group / Doctor Contact
- **Tagline**: "Smart Healthcare & Queue Ecosystem"
- **Brand Personality**: Clinical, modern, trustworthy, high-contrast, premium enterprise medical SaaS.
- **Brand Assets**:
  - Icon: `/logo-icon.png` (Rounded square backdrop, cross/heart emblem)
  - Full Logo: `/LOGO.png` / `/logo-full.png` (Navy brand lettering with medical cross mark)

---

## 2. Color Palette

### 2.1 Brand Tokens
| Token | Light Mode Hex | Dark Mode Hex | RGB / Notes | Web Usage |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | `#1B3A8C` | `#5B8DEF` | `rgb(27, 58, 140)` | Brand header, primary buttons, active pill tabs |
| `primaryDark` | `#12295E` | `#A9C4FF` | `rgb(18, 41, 94)` | Gradient end, modal headings, high-emphasis text |
| `primaryLight` | `#3B82F6` | `#93C5FD` | `rgb(59, 130, 246)` | Focus rings, info badges, glow effects |
| `secondary` | `#22C55E` | `#34D399` | `rgb(34, 197, 94)` | Live queue badges, success states, WhatsApp CTA |
| `secondaryDark`| `#15803D` | `#10B981` | `rgb(21, 128, 61)` | Secondary text contrast, verified checkmarks |
| `secondaryLight`| `#DCFCE7` | `#0D2D1B` | `rgb(220, 252, 231)` | Success pill backgrounds, Live status container |

### 2.2 Backgrounds & Surfaces
| Token | Light Mode Hex | Dark Mode Hex | Web Usage |
| :--- | :--- | :--- | :--- |
| `background` | `#FFFFFF` | `#080F1D` | Default page root background |
| `backgroundSoft`| `#F4F7FE` | `#0C1526` | Login backdrop, dashboard page canvas |
| `surfaceWhite` | `#FFFFFF` | `#111C2E` | Card surface, modal sheet surface |
| `surface50` | `#F9FAFB` | `#0C1526` | Subtle input background, role pill container |
| `surface100` | `#F3F4F6` | `#162238` | Hover background, secondary button fill |
| `surface200` | `#E5E7EB` | `#19263D` | Card border, list divider |
| `surface300` | `#D1D5DB` | `#22334F` | Input border, active container stroke |

### 2.3 Typography & Ink Hierarchy
| Token | Light Mode Hex | Dark Mode Hex | Web Usage |
| :--- | :--- | :--- | :--- |
| `ink900` | `#111827` | `#F8FAFC` | Main headings (`h1`, `h2`), large metric values |
| `ink800` | `#1F2937` | `#F1F5F9` | Section headers, card titles, doctor names |
| `ink700` | `#374151` | `#CBD5E1` | Body copy, input labels, primary descriptions |
| `ink600` | `#4B5563` | `#94A3B8` | Secondary copy, metadata, timestamps |
| `ink500` | `#6B7280` | `#7D8FA9` | Muted subtitles, helper text, empty state descriptions |
| `ink400` | `#9CA3AF` | `#64748B` | Input placeholders, inactive icon glyphs |
| `ink300` | `#D1D5DB` | `#475569` | Structural dividers, subtle borders |
| `ink200` | `#E5E7EB` | `#334155` | Hairline separators |

### 2.4 Semantic Status Colors
| Status | Text Color | Background Pill Color | Border Color |
| :--- | :--- | :--- | :--- |
| **Success / Live** | `#15803D` (`dark: #34D399`) | `#DCFCE7` (`dark: #0D2D1B`) | `#86EFAC` (`dark: #065F46`) |
| **Danger / Absent** | `#DC2626` (`dark: #F87171`) | `#FEF2F2` (`dark: #450A0A`) | `#FECACA` (`dark: #7F1D1D`) |
| **Warning / Waiting**| `#B45309` (`dark: #FBBF24`) | `#FEF3C7` (`dark: #451A03`) | `#FDE68A` (`dark: #78350F`) |
| **Info / Checked In**| `#1D4ED8` (`dark: #60A5FA`) | `#EFF6FF` (`dark: #172554`) | `#BFDBFE` (`dark: #1E3A8A`) |

---

## 3. Typography Hierarchy

### 3.1 Font Family
- **Web Reference**: `"Noto Sans", "Noto Sans Bengali", "Noto Sans Devanagari", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`
- **Mobile Native Implementation**: System Sans (SF Pro on iOS, Roboto on Android) with Noto Sans fallbacks.

### 3.2 Font Scales & Weights
| Name | Size (px) | Line Height (px) | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `3xl` | 30 | 36 | 800 (ExtraBold) | Hero banner, KPI metric value |
| `2xl` | 24 | 32 | 700 (Bold) | Screen title, modal title |
| `xl` | 20 | 28 | 700 (Bold) | Section heading, doctor card name |
| `lg` | 18 | 28 | 600 (SemiBold) | Group title, stat card label |
| `base`| 16 | 24 | 500 / 600 | Standard body text, primary button label |
| `sm` | 14 | 20 | 400 / 500 | Secondary text, input text, table cell |
| `xs` | 12 | 16 | 500 / 600 | Badges, pills, input labels, timestamps |

---

## 4. Spacing & Radius

### 4.1 Spacing Scale (4px Base Grid)
- `half`: `2px`
- `one`: `4px`
- `two`: `8px`
- `three`: `16px` (Standard screen padding & card internal padding)
- `four`: `24px` (Section gaps)
- `five`: `32px` (Major container separation)
- `six`: `64px` (Large layout breaks)

### 4.2 Border Radius
- `sm` (`8px`): Badges, small action pills, tag chips
- `md` (`12px`): **Standard Buttons, Form Inputs, Icon Boxes**
- `lg` (`16px`): **Standard Cards, List Containers, Stat Cards**
- `xl` (`24px`): **Hero Containers, Bottom Sheets, Large Modals**
- `full` (`9999px`): Status dots, live queue pills, avatar rings

---

## 5. Component Specifications

### 5.1 Buttons
- **Primary Button**:
  - Background: Gradient from `#1B3A8C` to `#12295E` (or solid `#1B3A8C`)
  - Text: `#FFFFFF`, `14px` / `16px`, SemiBold (`600`)
  - Height / Padding: `48px` min-height (`py-3`, `px-4`), `rounded-xl` (`12px`)
  - Shadow: `shadow-blue-900/20` (`elevation: 2`)
  - Active State: `scale: 0.99` / opacity `0.85`
- **Secondary / Outline Button**:
  - Background: `#FFFFFF` (`dark: #162238`)
  - Border: `1px solid #E5E7EB` (`dark: #19263D`)
  - Text: `#374151` (`dark: #CBD5E1`), `14px`, Medium (`500`)
  - Height: `44px` min-height, `rounded-xl` (`12px`)
- **Ghost / Icon Button**:
  - Background: Transparent (or `#F3F4F6` on touch)
  - Icon Color: `#4B5563` (`dark: #94A3B8`)
  - Touch Target: Minimum `44px × 44px`

### 5.2 Form Inputs
- **Container**: `rounded-xl` (`12px`), `border: 1px solid #E5E7EB` (`dark: #22334F`), `background: #F9FAFB` (`dark: #162238`)
- **Text**: `14px`, `#111827` (`dark: #F8FAFC`)
- **Placeholder**: `#9CA3AF` (`dark: #64748B`)
- **Leading Icon**: Left-aligned, `16px × 16px`, color `#9CA3AF`
- **Trailing Action**: Password visibility eye toggle, clear button
- **Focus State**: `border-color: #1B3A8C`, subtle glow ring (`#1B3A8C1A`)
- **Error State**: `border-color: #DC2626`, error text in `12px` with `AlertCircle` icon

### 5.3 Cards & Containers
- **Background**: `#FFFFFF` (`dark: #111C2E`)
- **Border**: `1px solid #E5E7EB` (`dark: #19263D`)
- **Radius**: `16px` (`rounded-2xl`)
- **Padding**: `16px` (`p-4`)
- **Shadow**: Subtle blue elevation (`0px 2px 4px rgba(27, 58, 140, 0.05)`)

### 5.4 Doctor Cards (Web Reference: `DoctorGrid.tsx`)
- Avatar: `48px × 48px` circle with 2-letter uppercase initials or photo.
- Header: Doctor Name (`16px font-bold #1F2937`), Verified checkmark badge (`#22C55E`).
- Meta Row: Specialization pill (`#EFF6FF` bg, `#1D4ED8` text), Experience pill (`#FEF3C7` bg, `#B45309` text).
- Clinic Row: Location pin icon (`#6B7280`), Clinic Name & City (`13px #4B5563`).
- Footer Row: Consultation Fee (`₹XXX` in `16px font-bold #1B3A8C`), "Book" action button.

### 5.5 Stat Cards (Web Reference: `StatCard.tsx`)
- Container: `rounded-2xl`, white background with colored top accent border.
- Top: Metric Title (`13px font-semibold #6B7280`) + Floating Icon box (`36px × 36px rounded-xl` with scheme tint).
- Center: Large Value (`30px font-extrabold #111827`).
- Bottom: Subtitle / trend indicator (`12px #6B7280`).

---

## 6. Navigation & Mobile Adaptation Rules

| Web Pattern | Mobile Native Pattern | Rule |
| :--- | :--- | :--- |
| **Top Navbar Links** | **Bottom Tab Bar** | 4-5 core tabs: `Home`, `Appointments`, `Doctors`, `Profile` |
| **Desktop Sidebar (Clinic / Doctor)** | **Collapsible Drawer / Tab Subnav** | Retain same tab labels and active blue selection pills |
| **Hover Tooltips** | **Long Press / Inline Labels** | Never hide critical information behind hover states |
| **Desktop Modal Dialogs** | **Bottom Sheets (`ModalSheet`)** | Slide up from bottom with drag handle, rounded top corners (`24px`) |
| **Table Data (Multi-column)** | **Stacked Card List** | Display record attributes as key-value pairs inside standard cards |
| **Horizontal Filter Bar** | **Scrollable Pill Chips (`no-scrollbar`)** | Touch swipeable horizontal pill bar with 8px gap |
| **Touch Targets** | **Minimum 44px × 44px** | All tappable icons and buttons must satisfy standard mobile accessibility |
| **Safe Areas** | **SafeAreaProvider / insets** | Respect dynamic island, notch, and home indicator bars |

---

## 7. Icons Reference

- **Icon Set**: Lucide Icons (`lucide-react` on Web -> `lucide-react-native` or matching vector glyphs on Mobile).
- **Core Icons Used**:
  - `Stethoscope` (Doctor / Medical)
  - `CalendarDays`, `Clock` (Appointments & Queue)
  - `MapPin`, `Building2` (Clinic & Locations)
  - `User`, `Users` (Profile & Patients)
  - `ShieldCheck`, `CheckCircle2` (Verification & Security)
  - `Mail`, `Lock`, `Eye`, `EyeOff` (Authentication)
  - `Phone`, `MessageCircle` (Helpdesk & WhatsApp)
  - `LayoutDashboard`, `Inbox`, `AlertCircle` (Portals & Alerts)

---

## 8. Items Marked "Needs Verification"

1. **Push Notification Credentials**: Needs verification when backend notification services are connected in later phases.
2. **Deep Linking Scheme in Production**: Needs verification against client domain registration before release.
