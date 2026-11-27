# PaperInk — Material Design 3 (`m3.material.io/develop`) Master Specification

## 1. Architecture Overview
PaperInk's UI and GUI follow Google's official **Material Design 3 (Material You)** developer guidelines (`https://m3.material.io/develop`):
- **Tonal Surface Hierarchy**: Elevation is communicated primarily through surface container tone steps (`surface-container-lowest` → `surface-container-low` → `surface-container` → `surface-container-high` → `surface-container-highest`) rather than heavy drop shadows or blurry glassmorphism.
- **Dynamic Color Seeds**: Supports 4 Material You dynamic color palettes (`baseline` Material Violet `#6750A4`, `blue` Google Blue `#0B57D0`, `emerald` Forest Emerald `#146C2E`, `terracotta` Editorial Terracotta `#8F4C38`) across both Light and Dark themes, plus 7 dedicated E-Ink & paper reading modes.
- **Adaptive Layout & Navigation**:
  - **Expanded / Medium Viewports (`>= 840px`)**: Left **M3 Navigation Rail** (`88px` width) with brand crest, quick import action, and `56px × 32px` active indicator pills (`--md-sys-color-secondary-container`), paired with an **M3 Rounded Main Workspace Surface Container** (`28px` corner radius).
  - **Compact Viewports (`< 840px`)**: Bottom **M3 Navigation Bar** (`80px` height) with `64px × 32px` active indicator pills and `12px` Label Medium typography.

## 2. Core M3 Components Implemented
1. **M3 Top App Bar & Docked Search Bar**:
   - Full-bleed tonal header with **M3 Search Bar** (`48px` height, `28px` full radius, `surface-container-high` fill), **M3 Dynamic Color Seed Switcher**, **M3 Filled Tonal Button** ("Cập nhật"), **M3 Outlined Button** ("Studio"), and **M3 Extended FAB** ("Thêm sách", `16px` large corner radius, `primary-container` fill).
2. **M3 Filter & Assist Chips**:
   - Sub-navigation tabs (`Tất cả sách`, `Yêu thích`, `Đã đọc xong`, `Sách nói`) use `8px` small corner radius, `32px` height, `1px` `outline-variant` border, and active `secondary-container` fill with a leading checkmark (`✓`).
3. **M3 Cards (Filled, Elevated, Outlined)**:
   - Hero "Đang đọc" (`now-reading-card`), Bento statistics (`bento-card`, `kpi-tile`), Collection folders (`collection-card`), and 3D Bookshelf cards (`book-card`) use M3 `16px`–`28px` corner radii, tonal surface fills, and state-layer hover overlays (`8%` opacity).
4. **M3 Dialogs, Bottom Sheets & Side Sheets**:
   - `28px` extra-large top corner radius, `32px × 4px` drag handle (`outline-variant`), and `surface-container-low` background.
5. **M3 Controls**:
   - **Segmented Buttons**: Pill track with `1px` `outline` border and `secondary-container` active segment.
   - **Switches**: `52px × 32px` track with expanding thumb (`16px` → `24px` when checked).
   - **Sliders & Linear Progress Indicators**: Rounded `6px`–`8px` active & inactive tracks with M3 primary indicator fill.
