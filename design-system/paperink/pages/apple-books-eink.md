# PaperInk — Apple Native + Liquid Glass + E-Ink Page Override

> Overrides `MASTER.md` to combine **Apple Native Experience** (`apple-native-experience`) + **Apple Liquid Glass** (`liquid-glass`, sparingly on floating chrome/controls) + **Kindle E-Ink Reading Surface** for Samsung Galaxy S25 Ultra & Desktop.

## Visual Direction
- **App Chrome & Library**: Apple Books / iOS HIG aesthetic — Large display title (`-0.03em` tracking), generous whitespace, grouped inset cards (`16–20px` radius), iOS segmented controls, native pill toggles, hairline separators, and adaptive Liquid Glass (`backdrop-filter: saturate(180%) blur(22px)`) exclusively on sticky headers, floating reader capsules, and selection bars.
- **Reading Canvas (Separate Opaque Layer)**: Pure distraction-free matte reading paper (6 eye-care themes: `Apple Sáng`, `Kindle Paper`, `Giấy cổ Sepia`, `E-Ink B&W`, `Lá dịu Sage`, `AMOLED Đêm`), keeping zero glass/blur behind book prose.
- **Typography**:
  - UI Chrome: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif` (with `tabular-nums` for counts/pages/percentages).
  - Book Reading Canvas: `Literata`, `New York`-inspired `Lora` & `Newsreader`, `Atkinson Hyperlegible`, and `SF/Inter Sans`.
- **Icons**: 100% consistent SF-Symbols-inspired inline SVG icons (`stroke-width: 1.75`, `stroke-linecap: round`, `stroke-linejoin: round`). Zero emojis or raw Unicode symbols as structural icons.
- **Accessibility & Touch**:
  - Minimum `44×44px` touch targets with `>= 8px` gaps.
  - Visible `2px` focus rings (`:focus-visible`) on every interactive control; `scroll-padding-top` prevents sticky header overlap.
  - `>= 4.5:1` contrast on primary and secondary text across all 6 themes (light and dark).
  - Full support for `@media (prefers-reduced-motion: reduce)` and `@media (prefers-reduced-transparency: reduce)`.
  - Viewport meta allows pinch-zoom (never locks `maximum-scale=1.0`).
