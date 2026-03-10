# Copilot Workspace Instructions — Markus Strickert Portfolio

## 🧑 Owner & Context
- **Owner**: Markus Strickert — Systems Verification Engineer & Astrophysicist
- **Purpose**: Personal portfolio website showcasing academic research, professional work, and interactive projects
- **Hosted via**: GitHub Pages (static HTML/CSS/JS, no build step)

---

## 🏗️ Project Architecture

### Tech Stack
- **HTML5** — semantic, hand-written pages (no framework, no templating engine at runtime)
- **CSS3** — single main stylesheet (`css/main.css`, ~3200+ lines), plus normalize/reset sheets
- **Vanilla JavaScript** — single file (`js/app.js`), handles all interactivity
- **SVG** — inline SVGs for mind-map connection lines and decorative elements
- **Fonts** — Google Fonts: Montserrat (headings), Nunito (body)

### File Map
| File | Purpose |
|---|---|
| `index.html` | Home page — interactive skill circles with expand overlay |
| `about.html` | About me page |
| `academic.html` | Academic experience |
| `work-details.html` | Detailed competence profile |
| `portfolio.html` | Portfolio page |
| `projects.html` | Space-themed projects page with 5 interactive cards |
| `contact.html` | Contact form (Formspree) |
| `css/main.css` | ALL custom styles — single large file |
| `css/modern_normalize.css` | Browser normalization |
| `css/html5bp.css` | HTML5 Boilerplate defaults |
| `css/resume.css` | Resume-specific styles |
| `js/app.js` | ALL JavaScript — skill circles, project cards, hamburger menu |
| `generate_portfolio.py` | Python script to auto-generate portfolio from JSON |
| `portfolio.json` | Portfolio data |

### CSS Custom Properties (`:root`)
```css
--link-color: #0077cc;
--link-color-hover: #00487c;
--header-footer-bg-color: #f0f0f0;
--aside-accent-color: #9d836b;        /* Main accent — warm brown */
--skill-bar-fill-color: #f3e4c6;
--blockquote-bg-color: #f7fafc;
--blockquote-accent-color: #4a5568;
--blockquote-text-color: #4a5568;
```

---

## 🎨 Design System

### General Pages (Home, About, Academic, Work, Contact, Portfolio)
- **Palette**: warm browns/tans (`#9d836b`), cream (`#f3e4c6`), white backgrounds
- **Header/Footer**: Light grey (`#f0f0f0`)
- **Body text**: Dark grey (`#333`, `#4a5568`)
- **Hamburger menu lines**: Dark (`#333`)

### Projects Page (Space Theme)
- **Body class**: `projects-page` — required on `<body>` for scoped styles
- **Header class**: `projects-header` — applied directly on `<header>` (NOT nested inside `.projects-page`)
- **Background**: Dark navy (`#0a0e27`, `#1a1f3a`, `#0d1629`)
- **Accent color**: Cyan (`#4fc3f7`)
- **Heading**: Cyan text with subtle drop-shadow glow
- **Border line**: Solid 2px `#4fc3f7` (NOT gradients)
- **Hamburger menu lines**: White (`#ffffff`) — overridden via `.projects-page .menu-toggle span`
- **Cards**: Dark translucent backgrounds with cyan borders
- **Contact section at bottom**: Dark-themed cards with cyan accents

### Mind Map (Home Page)
- **Blob colors**: Dark grey gradient (#2d3142 → #3f4556)
- **Blob radius**: 380px from center at 45° intervals
- **Animation**: `blobFlowOut` 1.2s spring cubic-bezier
- **Tooltips**: Appear ABOVE blobs (bottom positioning), max-width 300px, bullet-point format
- **SVG lines**: Connect from image edge (100px radius) to blob positions

---

## ⚠️ Critical Rules & Lessons Learned

### CSS Selector Specificity
**ALWAYS check HTML structure before writing CSS selectors.**
- The `<header class="page-header">` is a SIBLING of `<div class="page-content projects-page">`, NOT a child
- Selectors like `.projects-page .page-header` will NEVER match — use direct class `.projects-header` instead
- When adding page-specific styles, add a unique class directly to the element, don't rely on parent nesting across sibling boundaries

### Body Classes for Page Scoping
- Projects page: `<body class="projects-page">` — needed for hamburger menu override and contact section styling
- Contact page: `<body class="contact-page">`
- Always check whether the `<body>` tag has the correct class before writing scoped styles

### SVG Animations
- CSS `x` and `y` properties do NOT work reliably for animating SVG elements in all browsers
- CSS `transform: translate()` values without units (e.g., `translate(100, 200)`) don't work in CSS  — they need `px` units
- For SVG animations, prefer JavaScript-driven animation (GSAP, Web Animations API, or requestAnimationFrame) over CSS keyframes
- SVG elements inside containers with `overflow: hidden` will be clipped — check parent overflow

### Browser Caching
- When user opens HTML files via `file://` protocol, CSS/JS changes may not appear
- Always remind user to hard-refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Suggest running a local server (`python -m http.server 8000`) for reliable testing

### Git Policy
- **Do NOT automatically push to GitHub** — wait for explicit user instruction
- Commits are acceptable to stage, but pushing requires user confirmation

---

## 📋 Mandatory Workflow Checklist

### Before Making ANY Change
1. **Read the target file** — understand current state, don't assume from memory
2. **Identify ALL parts of the request** — enumerate each task explicitly
3. **Check for existing CSS rules** — search for the selector before writing new rules to avoid conflicts or duplication
4. **Verify HTML structure** — confirm parent-child relationships before writing nested CSS selectors
5. **Check for body classes** — ensure page-specific scoping classes exist on `<body>`

### During Implementation
6. **Address EVERY part of the request** — create a todo list for multi-part requests, check each one off
7. **Use correct selectors** — match the actual DOM hierarchy, not assumed hierarchy
8. **Avoid duplicate rules** — search `main.css` for existing rules before adding new ones
9. **Maintain responsive design** — update media queries if modifying layout properties
10. **Keep consistent formatting** — 2-space indentation in HTML, match existing CSS style

### After Making Changes
11. **Verify the edit applied** — re-read the file to confirm the change is present
12. **Check for orphaned rules** — if renaming selectors, update ALL occurrences (including media queries)
13. **Check for errors** — run error checking on modified files
14. **Test selector validity** — mentally trace: does this selector actually match an element in the HTML?
15. **Summarize ALL changes made** — list each modification with what it affects

---

## 🔧 Common Tasks & Patterns

### Adding a New Page
1. Copy structure from an existing page (e.g., `contact.html`)
2. Include all 3 stylesheets + `js/app.js`
3. Include hamburger menu HTML block
4. Include `page-header` with container, h1, and back-to-portfolio link
5. Include `page-footer`
6. Add nav link in ALL other pages' hamburger menus
7. If themed differently, add a body class and scope styles accordingly

### Styling a Page-Specific Element
1. Add a unique class to the element (e.g., `.projects-header`)
2. Write CSS rules using that class directly
3. Do NOT rely on parent `.page-content` wrapper for header/footer elements — they're siblings
4. Update all media queries to use the new selector

### Adding Interactive Features
1. Add HTML structure in the page file
2. Add styles in `css/main.css` (keep related rules grouped together)
3. Add JavaScript in `js/app.js` (within the DOMContentLoaded listener)
4. Use `document.querySelector` checks before attaching events — the same JS file runs on ALL pages

### Proper Page Centering and Full-Width Layouts - CRITICAL FIX
**Problem:** `.page-content .container` was using `display: grid; grid-template-columns: 1fr;` which created a narrow column effect, preventing proper page centering.

**Solution - MUST USE FOR CENTERED CONTENT:**
```css
.page-content .container {
  display: block;              /* ← NOT grid! Allows proper centering */
  max-width: 1400px;           /* ← Match header width constraint */
  width: 100%;
  padding: 0 2rem;
  margin: 0 auto;              /* ← Centers the container on page */
}
```

**Why this works:**
- `display: block` allows `margin: 0 auto` to actually center the container
- `display: grid; grid-template-columns: 1fr` creates a grid that appears narrow/constrained
- Header uses `display: flex; align-items: center` (different approach but also works)
- Both `.page-header .container` and `.page-content .container` MUST have matching `max-width: 1400px` to align properly

**When adding new centered pages:**
- Always use `display: block` (not grid) in `.your-page .container` rules
- Always set `max-width: 1400px; margin: 0 auto;` for proper centering
- If using flexbox for alignment, ensure parent has `max-width` constraint

### Modifying the Skill Circles (Home Page)
- Circles: `.hero-circle` with size variants `--xl`, `--lg`, `--md`, `--sm` in `main.css`
- Positions: set via inline `style="left: X%; top: Y%;"` in `index.html`
- Data: `circleData` object in `app.js` maps `data-topic` to heading, link, and bullet points
- Overlay: `.circle-overlay` with `.circle-detail` split panel (left heading, arc divider, right points)
- Arc direction: JS dynamically adds `.arc-flipped` class when clicked circle is on the right half
- Responsive: circles hidden on mobile (`≤768px`), large screen sizes at `≥1600px`

### Modifying Project Cards (Projects Page)
- Cards: `.project-card` in HTML, expandable via `toggleProject()` in JS
- Icons: unique animation class per card (rotate, pulse, orbit, flip, expand)
- Details: hidden by default, shown on click with smooth expand animation

---

## 📐 Responsive Breakpoints
| Breakpoint | Target |
|---|---|
| > 1024px | Desktop — full layout |
| ≤ 1024px | Tablet — 2-column grids, smaller fonts |
| ≤ 768px | Mobile — single column, stacked header elements |
| ≤ 480px | Small mobile — compact spacing, smaller padding |

---

## 🚫 Things to NEVER Do
1. Never use `.projects-page .page-header` — header is a sibling, not a child
2. Never auto-push to GitHub without explicit user permission
3. Never assume CSS changes are visible — remind about hard refresh
4. Never add SVG animations using CSS `x`/`y` properties — they don't work cross-browser
5. Never skip reading the current file state before editing
6. Never add `!important` unless absolutely necessary and documented
7. Never create separate CSS files — all custom styles go in `main.css`
8. Never create separate JS files — all logic goes in `app.js`
9. Never skip media query updates when changing layout properties
10. Never use rainbow/multi-color gradients for the projects page — keep it minimal with cyan accent
11. **Never use `display: grid; grid-template-columns: 1fr;` for `.page-content .container`** — use `display: block;` instead for proper centering with `margin: 0 auto;`

---

## 🤖 Task Planning Workflow (Agent Instructions)

### How to Approach Multi-Step Tasks
For every task (unless the user says otherwise):

1. **Research first** — Use a sub-agent to thoroughly read and understand all relevant code before making any changes
2. **Create a todo list** — Break the task into specific, actionable items and track progress with `manage_todo_list`
3. **Ask design questions upfront** — If any design decisions are ambiguous, ask the user before implementing
4. **Self-review each step** — For every task, ask: "Does this make sense visually? Will the user ask follow-up style questions? Does it fit the page's aesthetic?"
5. **Verify no interference** — After making changes, check that new code doesn't break or conflict with existing styles/scripts
6. **Mark tasks done individually** — Update the todo list immediately after completing each step, don't batch completions

### Breaking Out of Refinement Loops (Critical!)
**When tweaking the same parameter 3+ times without visible improvement, STOP and ask clarifying questions:**

1. **Visual specifications are hints to change tools**
   - If user draws ASCII art, diagrams, or uses exact visual language ("parenthesis )", "half-circle", "bracket shape"), interpret this as: *"This specific tool/shape is needed, not parameter tweaking"*
   - ASCII art = specification, not decoration. Act immediately.

2. **Red flags for loop detection**
   - Modifying the same CSS property repeatedly (border-radius %, transform values, position offsets)
   - User reports "nothing changed" or "it looks wrong" after confirmed edits
   - Suspect caching, but if verified via hard-refresh or [red test](https://css-tricks.com/debugging-css/), question the approach itself
   - If >3 edits to the same property haven't solved it, the property is wrong, not the value

3. **Shift strategy if:**
   - Currently using CSS transforms/borders/position → user describes a *shape* → switch to SVG `clip-path` or `mask`
   - Currently adjusting flex/grid layout → user says "content disappears on resize" → check viewport constraints/responsive overrides
   - Currently tweaking colors/opacity → user says "doesn't look right" → ask if the *structure* (not colors) is wrong

4. **Ask before adjusting 3x in a row:**
   - "I've adjusted [property] three times. Is the current approach right, or should we try [alternative tool]?"
   - "Does this visual match what you see, or is the structure itself wrong?"
   - Example: "I'm tweaking border-radius percentages. Would an SVG `clip-path` be clearer for this shape?"

5. **Document the lesson** (brief one-liner in commit message or conversation)
   - This helps prevent repeating the same loop later

### Quality Checks
- After CSS changes: verify no duplicate selectors, check media queries, trace DOM hierarchy
- After JS changes: verify null-safety guards for page-specific elements
- After HTML changes: verify the element is within the correct parent, check class names match CSS
- Always remind user to hard-refresh (`Ctrl+Shift+R`) when testing
