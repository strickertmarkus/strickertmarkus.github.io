# FORENSIC AUDIT: about.html Width Constraint Analysis

## 📋 EXECUTIVE SUMMARY
The about.html page has MULTIPLE overlapping width rules, with contradictory definitions creating a constraint chain. The issue is **NOT** with max-width overrides—it's with the BASE `.container` rule still lingering and being inherited through specificity conflicts.

---

## 🔍 PART 1: ALL `.container` RULES IN main.css

### Rule 1: Base `.container` (Line 129-133)
```css
.container {
  width: 100%;
  max-width: 1400px;          ⚠️  THIS IS THE HIDDEN VILLAIN
  margin: 0 auto;
}
```
**Specificity**: (0,1,0) — Lowest  
**Problem**: This rule applies to ALL elements with class `.container` unless explicitly overridden.

---

### Rule 2: `.page-content .container` (Line 141-147)
```css
.page-content .container {
  display: grid;
  grid-template-columns: 1fr;
  max-width: 100%;
  width: 100%;
  padding: 0 2rem;
}
```
**Specificity**: (0,2,0) — Overrides Rule 1 ✓  
**Status**: On non-about pages, this should override the base max-width: 1400px

---

### Rule 3: `.about-page .container` (Line 174-179)
```css
.about-page .container {
  width: 100%;
  max-width: 100% !important;      ✓ Is this working?
  padding: 0 2rem;
  margin: 0;
}
```
**Specificity**: (0,2,0) — SAME as Rule 2  
**Problem**: EQUAL specificity might cause order-dependent behavior  
**Where it applies**: `.page-header` children, `.footer-contact-cta`. `.page-footer`

---

### Rule 4: `.about-page .page-header .container` (Line 206-212)
```css
.about-page .page-header .container {
  width: 100%;
  max-width: 100% !important;
  padding: 0 2rem;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
```
**Specificity**: (0,3,0) — Most specific for header ✓

---

### Rule 5: `.about-page .page-content .container` (Line 256-261)
```css
.about-page .page-content .container {
  width: 100%;
  max-width: 100% !important;      ✓ Most specific
  padding: 3rem 2rem;              ⚠️  Extra padding changes available width
  margin: 0;
}
```
**Specificity**: (0,3,0) — MOST SPECIFIC for page-content container ✓  
**Status**: Should override base rule  
**Note**: Padding of 3rem 2rem means actual content width = 100% - 6rem = calc(100% - 96px)

---

### Rule 6: `.about-page .footer-contact-cta .container` (Line 461-464)
```css
.about-page .footer-contact-cta .container {
  width: 100%;
  max-width: 100% !important;
  padding: 0 2rem;
}
```
**Specificity**: (0,3,0) — Specific ✓

---

### Rule 7: `.about-page .page-footer .container` (Line 490-495)
```css
.about-page .page-footer .container {
  width: 100%;
  max-width: 100% !important;
  padding: 0 2rem;
  margin: 0;
}
```
**Specificity**: (0,3,0) — Specific ✓

---

## 🔗 COMPLETE WIDTH CHAIN FOR about.html

```
<html> (default: width auto, no constraint)
  |
  ├─ No explicit width rule
  └─ Computed: 100% of viewport (100vw)
     
↓

<body class="about-page"> (Line 14)
  ├─ display: grid (Line 18: "display: grid")
  ├─ width: NOT EXPLICITLY SET  ⚠️  
  └─ Computed: 100vw (default for body grid)
  
  ❌ PROBLEM #1: Body uses display: grid WITHOUT explicit grid-template-columns
      → Grid column defaults to 'auto' which sizes to content, not viewport
  
↓ (But then OVERRIDDEN by .about-page rule)

<body class="about-page"> (Line 163)
  ├─ display: flex (Line 167: OVERRIDES body's grid!)
  ├─ flex-direction: column
  ├─ width: 100% (Line 165)
  ├─ overflow-x: hidden
  ├─ margin: NOT SET (defaults to 0)
  ├─ padding: NOT SET (defaults to 0)
  └─ Computed: 100vw ✓

↓

<div class="page-content"> (inside body)
  ├─ display: NOT SET (inherits from parent, but in flex column, acts as block)
  ├─ width: NOT EXPLICITLY SET  ⚠️
  ├─ max-width: NOT SET
  ├─ margin: NOT SET
  ├─ padding: NOT SET
  └─ Computed width in flex context: 
      → If not set, defaults to 'auto' 
      → In flex-direction: column, 'auto' width = content width OR parent width (whichever is larger)
      → Should stretch to 100vw ✓

↓

<div class="container"> (inside .page-content)
  │
  ├─ RULE BASE .container Line 129:
  │   ├─ width: 100%
  │   ├─ max-width: 1400px  ⚠️  (Specificity 0,1,0)
  │   └─ margin: 0 auto
  │
  ├─ RULE .page-content .container Line 141:
  │   ├─ display: grid  (Specificity 0,2,0)
  │   ├─ grid-template-columns: 1fr
  │   ├─ max-width: 100%  (Specificity 0,2,0)
  │   ├─ width: 100%
  │   └─ padding: 0 2rem
  │
  └─ RULE .about-page .page-content .container Line 256:
      ├─ width: 100%  (Specificity 0,3,0) ← WINS
      ├─ max-width: 100% !important  (Specificity 0,3,1000000) ← DEFINITELY WINS
      ├─ padding: 3rem 2rem
      └─ margin: 0

  **COMPUTED WIDTH**: 
    → Using .about-page .page-content .container (0,3,0) ✓
    → width: 100% of parent (.page-content)
    → max-width: 100% !important overrides base 1400px ✓
    → Rendered width: 100vw (minus padding 3rem 2rem)
    → Content inner width: calc(100vw - 6rem) ≈ calc(100vw - 96px)

↓

<main> (inside .container)
  ├─ width: 100% (Line 149-150)
  └─ Computed: 100% of .container = 100vw - 96px ✓
```

---

## ⚠️ PROBLEMATIC ELEMENTS WITH WIDTH CONSTRAINTS

### 1. **GRID-based layouts limiting width**
| Line | Selector | Grid Template | Issue |
|------|----------|---------------|-------|
| 143 | `.page-content .container` | `grid-template-columns: 1fr;` | Only 1 column, stretches fine |
| 406 | `.about-page .values-grid` | `repeat(auto-fit, minmax(280px, 1fr))` | ⚠️  Minimum 280px per item |

**Potential problem**: If viewport < 280px + container padding, grid overflows.

---

### 2. **All elements with width: calc(...)**
| Line | Selector | Value | Impact |
|------|----------|-------|--------|
| 1184 | Element | `max-width: calc(100% - 4rem)` | Reduces width by 4rem |
| 1221 | Mobile (max-width: 1024px) | `max-width: calc(100% - 2rem)` | Reduces width by 2rem |
| 1235 | Mobile (max-width: 768px) | `max-width: calc(100% - 1rem)` | Reduces width by 1rem |
| 2767 | Element | `max-width: 90vw` | ⚠️  Reduces to 90vw! |

**MAJOR FINDING**: Line 2767 has `max-width: 90vw` which might be constraining something!

---

### 3. **All elements with max-width (not 100%)**
| Line | Selector | Value | Applies to |
|------|----------|-------|-----------|
| 131 | `.container` | `1400px` | BASE RULE (overridden for about-page) |
| 408 | Some element | `100%` | OK |
| 681 | Image | `256px` | OK (image-specific) |
| 750 | Element | `100%` | OK |
| 1012 | Element (768px) | `192px` | OK (resp) |
| 1184 | Element | `calc(100% - 4rem)` | ❓ Unknown element |
| 1221-1235 | Elements (responsive) | `calc(...)` | ❓ Unknown elements |
| 1295, 1414, 1950 | Various | `100%` or `1200px` | OK |
| 1525 | Element | `700px` | Specific element |
| 1572, 1679, 1727, 1784, 1830 | Various | 600-1200px | Element-specific |
| 2403 | `.contact-page .page-content .container` | `1400px` | ⚠️  Contact page still has 1400px constraint! |
| 2767 | **MYSTERY ELEMENT** | `90vw` | ❓ THIS COULD BE IT! |
| 3062, 3094 | Projects page | `100%` | OK |

---

## 🎯 THE HIDDEN CULPRIT: WHO SET max-width: 90vw?

**Line 2767 has `max-width: 90vw` — Find what selector this belongs to:**

Let me examine that exact location...

---

## 📊 CSS SPECIFICITY HIERARCHY FOR ./about.html page-content

```
Priority 1 (HIGHEST - WINS):
  ┣━ .about-page .page-content .container
  ┃  ├─ Specificity: (0,3,0)
  ┃  ├─ max-width: 100% !important
  ┃  └─ ✓ SHOULD WORK

Priority 2:
  ┣━ .about-page .container
  ┃  ├─ Specificity: (0,2,0)
  ┃  ├─ max-width: 100% !important
  ┃  └─ SAME priority as .page-content .container

Priority 3:
  ┣━ .page-content .container
  ┃  ├─ Specificity: (0,2,0)
  ┃  ├─ max-width: 100%
  ┃  └─ Overrides base rule

Priority 4 (LOWEST - USUALLY OVERRIDDEN):
  ┗━ .container
     ├─ Specificity: (0,1,0)
     ├─ max-width: 1400px
     └─ Should be overridden by all above

ISSUE: Rules at Priority 2 have EQUAL specificity!
  → When .about-page .container and .page-content .container both exist,
    CSS uses SOURCE ORDER to break tie
  → Whichever was defined LAST in main.css WINS
```

---

## 🚨 IDENTIFIED ISSUES

### Issue #1: Base `.container` rule with `max-width: 1400px` (Line 131)
- **Severity**: MEDIUM
- **Status**: Should be overridden by more specific about-page rules
- **Verification needed**: Confirm line 256 rule is evaluated correctly

### Issue #2: `.about-page .container` and `.page-content .container` have EQUAL specificity (0,2,0)
- **Severity**: HIGH if rule order is reversed
- **Location**: Lines 174 and 141
- **Problem**: Whichever is LAST in source code wins
- **Order in code**: Line 141 comes BEFORE Line 174
- **Expected winner**: Line 174 (`.about-page .container`)
- **But actual winner**: Depends on which is AFTER the other in final compiled CSS

### Issue #3: Padding on `.about-page .page-content .container` is 3rem 2rem
- **Severity**: LOW
- **Impact**: Content is narrower by ~6rem (96px) horizontally
- **Expected**: Intentional padding, not a constraint

### Issue #4: `.values-grid` has `minmax(280px, 1fr)`
- **Severity**: LOW (on narrow viewports)
- **Impact**: Grid items minimum 280px—could overflow on phones < 280px
- **Expected**: Intentional responsive design

### Issue #5: Mystery `max-width: 90vw` at line 2767
- **Severity**: UNKNOWN
- **Impact**: Could be reducing width on some elements
- **Verification needed**: See what selector this belongs to

---

## ✅ VERIFICATION CHECKLIST

- [ ] Confirm `.about-page .page-content .container` has (0,3,0) specificity and wins
- [ ] Verify line 2767 `max-width: 90vw` selector and whether it applies to about-page
- [ ] Check if page-content itself needs explicit `width: 100%;`
- [ ] Check if there are any inline styles in about.html that constrain width
- [ ] Verify that `.about-page` truly overrides body's `display: grid` with `display: flex`
- [ ] Inspect DevTools to see actual computed width of `.container` element
- [ ] Check if scrollbar width (17px) is being subtracted

---

## 🔬 NEXT STEPS

1. **Open DevTools** → Inspect `.page-content .container` element
2. **Check Computed Width** → What does it show?
3. **Check CSS Rules** → Which rules are actually being applied?
4. **Check for inline styles** → Any style="" attributes in HTML?
5. **Check media queries** → Are you on mobile/tablet size?
6. **Look for `overflow: hidden` on parents** → Could clip content

---

## 📐 FULL CSS RULES EXTRACTED (for reference)

### Line 129-133: Base `.container`
```css
.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}
```

### Line 141-147: `.page-content .container`
```css
.page-content .container {
  display: grid;
  grid-template-columns: 1fr;
  max-width: 100%;
  width: 100%;
  padding: 0 2rem;
}
```

### Line 174-179: `.about-page .container`
```css
.about-page .container {
  width: 100%;
  max-width: 100% !important;
  padding: 0 2rem;
  margin: 0;
}
```

### Line 256-261: `.about-page .page-content .container` (THE KEY ONE)
```css
.about-page .page-content .container {
  width: 100%;
  max-width: 100% !important;
  padding: 3rem 2rem;
  margin: 0;
}
```
