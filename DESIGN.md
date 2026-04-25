# Kaku! Design System

Kaku! is a writing-first kanji learning app. The product promise is simple:

**Kaku!**  
**kanarazu kaku**  
Write it, repeat it, remember it.

The interface should feel direct, physical, and a little playful. It uses neobrutalism to make practice feel like a tactile tool: thick borders, hard shadows, high-contrast surfaces, compact rounded corners, and confident typography.

## Brand

### Name

Use **Kaku!** as the product name. The exclamation mark is part of the name.

When Japanese context is useful, the app can be described as **Kaku! (書く)**, but the primary product mark is **Kaku!**.

### Tagline

Use **kanarazu kaku** as the brand tagline.

Preferred presentation:

- `kanarazu kaku`
- `Kanarazu Kaku!` for UI badges and uppercase label treatment

Meaning: "definitely write" / "always write." The tagline should reinforce the app's habit loop: writing is the path to remembering.

### Mascot

The mascot is **Koijo**, a green owl/bird who acts as the learner's companion and AI sensei.

Koijo should feel:

- observant, helpful, and encouraging
- energetic without becoming childish
- tied to writing practice, not generic gamification

Current mascot assets live in `public/animations/`:

- `level1.json` is used by `OwlLogo`
- `bird-speak.gif` is used in Koijo chat
- `bird-flying-jump.json` is used for success feedback
- `level4.json` is used for error feedback

Use Koijo in moments where the learner needs orientation, feedback, or encouragement. Do not place Koijo on every surface just for decoration.

## Product Personality

Kaku! is:

- **Writing-first**: the app should lead with drawing, tracing, saved words, and repeated recall.
- **Practical**: wording should focus on real learning actions instead of motivational filler.
- **Tactile**: UI should feel pressable, movable, and physical.
- **Focused**: screens should prioritize the current practice task.
- **Friendly**: Koijo can soften errors, but the interface should stay clear and efficient.

Avoid:

- soft SaaS minimalism
- glassy dashboard styling as the dominant visual language
- vague learning claims
- overexplaining features inside the UI
- decorative gradients or abstract background blobs

## Visual Language

Kaku! uses a neobrutalist style. The core pattern is:

- `border-2 border-border`
- `rounded-base`
- `shadow-shadow`
- press states that translate by the shadow offset and remove the shadow
- bright green primary surfaces
- white/blank cards over a lightly tinted page background

The UI should look constructed from solid pieces, not floating mist or soft panels.

## Mobile-First Style Contract

Use this section as the default source of truth for new UI. If a component needs to deviate, the reason should be functional: more touch room, a denser list, or a special canvas/learning surface.

### Spacing Scale

Kaku! uses Tailwind's 4px spacing grid. Prefer these values:

| Tailwind | Pixels | Use |
| --- | ---: | --- |
| `1` | 4px | tiny offsets, tab padding, separators |
| `1.5` | 6px | compact icon/text gaps |
| `2` | 8px | icon gaps, tiny chips, overlay controls |
| `2.5` | 10px | dense chips and badges |
| `3` | 12px | card internal gaps, compact padding |
| `4` | 16px | default page padding, default stack gap |
| `5` | 20px | standard card/panel padding |
| `6` | 24px | section gaps, relaxed page padding |
| `8` | 32px | large empty states, hero padding |
| `10` | 40px | large kanji banner padding |
| `24` | 96px | bottom safe area when bottom nav is visible |
| `28` | 112px | bottom safe area for long pages with bottom nav |

Do not introduce arbitrary spacing unless a fixed-format element needs it. If an arbitrary value is needed, prefer stable sizes already used in the app, such as `h-[52px]`, `h-[56px]`, `max-w-[140px]`, or `shadow-[2px_2px_0_var(--border)]`.

### Page Spacing

Default mobile page shell:

```tsx
"min-h-dvh bg-bg px-4 py-4 pb-24 font-sans"
```

Default content column:

```tsx
"mx-auto w-full max-w-md"
```

Use these page rules:

- Practice pages: `p-4 pb-24 sm:p-6 lg:max-w-lg`
- Long informational pages: `px-4 py-6 pb-28 sm:px-6 sm:py-8`
- Chat pages: full height, no outer page padding, `max-w-md lg:max-w-xl`
- Landing/about pages: expand only when the content genuinely benefits from layout columns

Canonical content widths:

| Width | Use |
| --- | --- |
| `max-w-sm` | drawing tools and compact controls |
| `max-w-md` | default mobile app column |
| `lg:max-w-lg` | detail and practice pages on larger screens |
| `lg:max-w-xl` | chat where message lines need more room |
| `max-w-5xl` | about/docs content |
| `max-w-6xl` | landing page layouts |

### Stack Rhythm

Use consistent gaps instead of one-off margins:

- `gap-2`: controls inside a row
- `gap-3`: dense cards, card internals, compact action groups
- `gap-4`: default vertical rhythm inside tools
- `gap-5`: hero copy groups and substantial panels
- `gap-6`: page sections and two-column grids

Prefer `flex flex-col gap-*` over repeated `mb-*` when spacing a component's children. Use `mb-*` when separating a header from a following independent region.

### Padding Rules

Default component padding:

| Component | Mobile Padding | Larger Screens |
| --- | --- | --- |
| small badge/chip | `px-2.5 py-1` | same |
| brand badge | `px-3 py-2` | same |
| compact card/list item | `p-3` | same or `p-4` |
| default card/panel | `p-4` | `sm:p-5` |
| content section | `p-5` | `sm:p-6` only for long-form |
| empty state | `p-8` or `py-20` | same |
| canvas guide padding | `p-8` | same |

For Kaku!, `p-4` is the default mobile surface padding. Use `p-5` when a card contains paragraphs or multi-row content. Use `p-3` for repeated list items so saved words stay scan-friendly.

### Size Rules

Touch targets must be at least 40px tall. Preferred sizes:

| Element | Size |
| --- | --- |
| small icon button | `h-9 w-9` |
| standard icon button | `h-10 w-10` |
| standard button | `h-10 px-4` |
| primary page action | `h-11` or `h-12 px-6` |
| high-emphasis mobile CTA | `h-[52px] px-6` |
| handwriting composer input | `h-[56px]` |
| chat input/send | `h-[52px]` |
| standard text input | `h-10` |
| tab list | `h-12 p-1` |
| bottom nav item | `h-12 sm:h-14` |

Canvas and kanji surfaces:

- handwriting canvas: `aspect-square w-full max-w-sm`
- learn canvas: `aspect-square w-full max-w-sm`
- kanji banner: `min-h-[220px]`
- single-kanji flip card: `h-[250px]`
- mascot mark block on landing: 112-170px depending on layout

### Border, Radius, Shadow Rules

Use these defaults:

| Surface | Border | Radius | Shadow |
| --- | --- | --- | --- |
| page card/panel | `border-2 border-border` | `rounded-base` | `shadow-shadow` |
| nested chip/tile | `border-2 border-border` | `rounded-base` | `shadow-[2px_2px_0_var(--border)]` |
| compact list item | `border-2 border-border` | `rounded-base` | `shadow-[3px_3px_0_var(--border)]` |
| primary button | `border-2 border-border` | `rounded-base` | `shadow-shadow` |
| destructive button | `border-2 border-border` | `rounded-base` | `shadow-[2px_2px_0_var(--border)]` |
| modal/dialog | `border-2 border-border` | `rounded-base` | `shadow-shadow` |

Avoid `rounded-2xl`, `rounded-3xl`, `shadow-xl`, `shadow-2xl`, `border-zinc-*`, and glassmorphism as defaults. They can remain in legacy code until touched, but new work should use the contract above.

Use `rounded-full` only for dots, true circular icons, or decorative background shapes. It should not be the default for cards, buttons, forms, or tabs.

### Typography Sizes

Mobile typography should stay compact and readable:

| Role | Class |
| --- | --- |
| micro label | `text-[10px] font-black uppercase tracking-[0.14em]` |
| section eyebrow | `text-[11px] font-black uppercase tracking-[0.24em]` |
| helper text | `text-xs text-muted-foreground` |
| secondary body | `text-sm font-medium leading-relaxed` |
| main body | `text-base font-medium leading-relaxed` |
| card title | `text-lg font-black uppercase leading-tight` |
| page title | `text-2xl font-bold` or `text-3xl font-black` |
| landing hero | `text-3xl font-black uppercase leading-none sm:text-5xl` |
| large kanji | `font-jp text-6xl` to `text-7xl` |

Use uppercase for labels, badge text, and major actions. Do not uppercase paragraph text or Japanese content.

### Icon Sizes

Use `lucide-react` icons with these sizes:

- `14px`: tiny inline action or badge icon
- `16px`: compact button icon
- `18px`: standard row/action icon
- `20px`: primary nav and form icons
- `24px`: rare emphasis icon

Icons inside buttons should usually inherit from the button primitive. Only override when the button has a custom fixed size.

### Shape

Default radius:

- `--radius: 0.375rem`
- Tailwind alias: `rounded-base`

Use small, consistent radii. Cards, buttons, tabs, inputs, toasts, and panels should generally use `rounded-base`.

Larger radii are acceptable only where the existing component pattern already uses them, such as some floating controls. Avoid pill-shaped controls unless the interaction clearly benefits from it.

### Borders

Use dark, visible borders as a core brand feature.

Default:

- `border-2`
- `border-border`

In light mode, `--border` is deep green-black. In dark mode, borders become light enough to preserve contrast.

### Shadows

Default shadow:

```css
--shadow-x: 4px;
--shadow-y: 4px;
--shadow-color: #163300;
```

Tailwind alias:

- `shadow-shadow`

Small nested elements can use:

- `shadow-[2px_2px_0_var(--border)]`
- `shadow-[3px_3px_0_var(--border)]`

Interactive controls should usually compress on hover/active:

```tsx
"hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
```

For smaller elements:

```tsx
"hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
```

## Color

The main palette is already defined in `src/app/globals.css`.

### Light Theme

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#fbfbfb` | page base |
| `--foreground` | `#163300` | primary text and border tone |
| `--main` | `#9FE870` | Kaku green, primary brand/action |
| `--main-foreground` | `#163300` | text on green |
| `--secondary` | `#e7e5e4` | neutral raised surfaces |
| `--blank` | `#ffffff` | cards, panels, inputs |
| `--danger` | `#ef4444` | destructive actions |
| `--page-surface` | `#f2f8eb` | page gradient end |

### Dark Theme

| Token | Value | Use |
| --- | --- | --- |
| `--background` | `#020618` | page base |
| `--foreground` | `#e2e8f0` | primary text |
| `--main` | `#00dc82` | Kaku green in dark mode |
| `--main-foreground` | `#020618` | text on green |
| `--secondary` | `#162032` | neutral raised surfaces |
| `--blank` | `#0f172b` | cards, panels, inputs |
| `--danger` | `#f87171` | destructive actions |
| `--page-surface` | `#060d1f` | page gradient end |

### Usage Rules

Use green for:

- primary actions
- active navigation
- selected tabs
- brand badges
- successful learning feedback
- Koijo brand blocks

Use white/blank for:

- canvases
- cards
- forms
- chat bubbles from Koijo
- content panels

Use secondary for:

- inactive chips
- supporting tiles
- search/count badges
- neutral cards

Use danger only for destructive actions and error states.

Do not create a one-note green interface. Green should be the brand accent and action color, balanced with blank, secondary, and strong foreground.

## Typography

Kaku! uses:

- **Poppins** for Latin UI text
- **Noto Serif JP** for Japanese characters and kanji display

Defined in `src/app/layout.tsx`:

- `--font-sans`
- `--font-jp`

### Latin UI

Use Poppins with strong weights:

- section labels: `text-[10px]` to `text-xs`, `font-black`, `uppercase`, wide tracking
- headings: `font-black` or `font-bold`, tight line height
- body: `font-medium`, relaxed line height
- buttons: `font-black` or `font-bold`, uppercase for major actions

Common label pattern:

```tsx
"text-[11px] font-black uppercase tracking-[0.24em]"
```

### Japanese Text

Use `font-jp` for kanji and kana display.

Kanji should be large, legible, and treated as a primary visual object. On word cards and banners, kanji badges should have strong weight and enough padding to feel like physical tiles.

## Layout

The app is mobile-first. Most core flows use a narrow practice column:

- `max-w-md` for writing/list/detail flows
- `lg:max-w-lg` or `lg:max-w-xl` where more room helps
- landing/about can expand to `max-w-5xl` or `max-w-6xl`

Core practice pages should feel like tools, not marketing pages. Keep controls close to the user's current task.

### Page Patterns

Landing:

- brand badge
- Koijo mark
- direct headline
- primary action to start writing
- short method cards

Writing:

- composed word input
- large square handwriting canvas
- recognized kanji candidates

List:

- searchable saved collection
- tabs for words and kanji
- compact cards with metadata and actions

Detail:

- word/kanji banner
- meaning and metadata panels
- write/learn actions
- Koijo chat entry

Chat:

- Koijo as AI Sensei
- Japanese pattern background
- bordered chat bubbles
- compact input surface

Learn:

- target kanji
- instruction card
- trace canvas
- success/error feedback with Koijo animation

## Components

### Buttons

Primary buttons should use the neobrutalist button primitive in `src/components/ui/button.tsx`.

Default pattern:

```tsx
"text-main-foreground bg-main border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
```

Use icons from `lucide-react` where possible.

Button text should be short and action-oriented:

- `Start Writing`
- `Open Word List`
- `Submit`
- `Ask Koijo`
- `Replay`

Canonical button recipes:

```tsx
// Standard primary
"h-10 px-4 rounded-base border-2 border-border bg-main text-main-foreground shadow-shadow"

// Mobile primary CTA
"h-12 px-6 rounded-base border-2 border-border bg-main text-main-foreground shadow-shadow text-base font-black uppercase"

// Icon action
"h-10 w-10 rounded-base border-2 border-border bg-blank text-foreground shadow-[2px_2px_0_var(--border)]"

// Overlay icon action
"h-9 w-9 rounded-base border-2 border-border bg-secondary shadow-[2px_2px_0_var(--border)]"
```

All pressable buttons should include a press transform unless disabled:

```tsx
"transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
```

### Cards and Panels

Cards should be physically outlined surfaces:

```tsx
"rounded-base border-2 border-border bg-blank p-4 shadow-shadow"
```

Use cards for repeated items, modals, forms, canvases, and content panels. Avoid nesting full cards inside full cards unless the inner card is a small tile or chip.

Canonical card recipes:

```tsx
// Default panel
"rounded-base border-2 border-border bg-blank p-4 shadow-shadow sm:p-5"

// Repeated saved-list item
"rounded-base border-2 border-border bg-blank p-3 shadow-[3px_3px_0_var(--border)]"

// Nested chip/tile
"rounded-base border-2 border-border bg-secondary px-2.5 py-1 shadow-[2px_2px_0_var(--border)]"
```

### Inputs

Inputs should preserve the tactile behavior:

```tsx
"bg-blank border-2 border-border rounded-base shadow-shadow focus:ring-4 focus:ring-main focus:translate-x-boxShadowX focus:translate-y-boxShadowY focus:shadow-none"
```

Use icons inside inputs when the action is clear, such as search or writing.

Canonical input recipes:

```tsx
// Standard search/input
"h-10 w-full rounded-base border-2 border-border bg-blank px-3 py-2 text-sm text-foreground shadow-shadow"

// Icon search input
"w-full rounded-base border-2 border-border bg-blank py-3 pl-11 pr-11 text-sm text-foreground shadow-shadow"

// Handwriting composer
"h-[56px] w-full bg-transparent pl-12 pr-10 text-lg font-bold outline-none"
```

### Tabs

Tabs use a bordered container with active green triggers. Keep labels short:

- `Words`
- `Kanji`
- `Meaning`

### Navigation

The bottom nav is a floating neobrutalist control. Active items use green with a small hard shadow. Keep the nav compact and icon-led.

Current nav destinations:

- Write
- List
- Theme
- Login/Logout

### Toasts

Toasts should follow the same tactile system as cards:

```tsx
"w-[352px] max-w-[calc(100vw-24px)] rounded-base border-2 border-border bg-blank p-4 shadow-shadow"
```

Use `shadow-xl`, `rounded-2xl`, and subtle zinc borders only for legacy toasts until they are restyled.

## Motion

Motion should reinforce tactility and feedback.

Use:

- button compression through translate/shadow removal
- quick fade/zoom for page content
- spring motion for active nav and flip cards
- Koijo/Lottie animations for feedback
- typing dots for chat loading

Avoid slow decorative motion that competes with writing practice.

Preferred timing:

- hover/tap microinteractions: 150-220ms
- content entrance: 200-300ms
- mascot feedback: around 3 seconds, then return focus to the task

## Voice and Copy

Kaku! speaks in short, practical sentences.

Good:

- "Write. Repeat. Remember."
- "Learn kanji by writing it until it sticks."
- "Trace over the guide and keep the stroke order roughly correct."
- "Open the writing board and begin."

Avoid:

- abstract claims like "unlock your full potential"
- long instructional paragraphs in the main workflow
- overly cute error text everywhere

Koijo can be warmer than the base UI:

- "Koijo is impressed!"
- "Not quite right. Try again."
- "Ask Koijo"

## Accessibility

Maintain:

- high contrast between text, surfaces, borders, and action colors
- clear focus rings on all interactive elements
- visible disabled states
- keyboard-accessible cards when they behave as links
- icon buttons with labels, titles, or accessible names

Canvas-based interactions should always have adjacent controls and visible state, such as candidates, submit, undo, and clear.

## Implementation Notes

Current design source files:

- `src/app/globals.css`: theme tokens, page backgrounds, neobrutalism variables
- `src/app/layout.tsx`: Poppins and Noto Serif JP font setup
- `src/components/ui/button.tsx`: primary neobrutalist button primitive
- `src/components/ui/tabs.tsx`: bordered tab system
- `src/components/OwlLogo.tsx`: Koijo logo animation
- `src/components/BottomNav.tsx`: floating bottom navigation
- `src/components/HandwritingCanvas.tsx`: writing board
- `src/components/LearnCanvas.tsx`: trace and validation board
- `src/components/KanjiBanner.tsx`: kanji/word hero card and Koijo chat entry
- `src/app/kanji/[word]/chat/page.tsx`: Koijo AI Sensei chat surface

### Current Inconsistencies To Resolve Over Time

The main app is neobrutalist, but the login card currently uses softer glass styling with `rounded-3xl`, blur, and subtle borders. If the login page is redesigned, bring it closer to the rest of the system:

- use `rounded-base`
- use `border-2 border-border`
- use `shadow-shadow`
- use `bg-blank`
- keep the Kaku green for the primary submit action

Some older components use direct zinc colors. Prefer semantic tokens such as `bg-blank`, `bg-secondary`, `text-foreground`, `text-muted-foreground`, `border-border`, and `bg-main` for future work.

Known legacy styles to normalize when touched:

- `src/components/LoginForm.tsx`: replace glass card styling with `bg-blank`, `rounded-base`, `border-2`, and `shadow-shadow`.
- `src/components/SearchToastCards.tsx`: replace `rounded-2xl`, `shadow-xl`, raw zinc borders, and soft icon containers with the toast recipe above.
- `src/components/KanjiDetailCarousel.tsx`: replace `rounded-3xl`, `shadow-sm`, and raw zinc borders with neobrutalist cards.
- `src/components/ui/button-variants.ts`: this is a softer shadcn-style variant file; prefer `src/components/ui/button.tsx` for Kaku product UI.
- `src/components/ui/input-group.tsx`: normalize if it becomes visible in main flows; it currently uses softer radius and border defaults.

## Design Checklist

Before shipping a new Kaku! screen or component, check:

- It uses the Kaku green only for brand, action, active, or success states.
- Interactive elements have thick borders and hard shadows.
- Hover/active states feel physically pressed.
- Kanji uses `font-jp` and is large enough to read.
- Koijo appears only where mascot presence adds feedback or guidance.
- Copy is short, concrete, and writing-focused.
- The layout works in a narrow mobile column first.
- Dark mode still has strong contrast.
- The component reuses existing tokens and primitives before adding new styles.
