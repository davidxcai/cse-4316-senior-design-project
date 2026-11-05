---
name: signify-ui
description: Hard UI copy and layout constraints for the Signify frontend. Covers no subtext, icon-first elements, minimal labels, and avoiding common AI-generated frontend patterns. Load before building, editing, or reviewing ANY Signify page, component, wireframe, or mockup, including small tweaks to text or layout.
---

# Signify UI Constraints

These rules are **hard constraints**, not style suggestions. If a rule conflicts with a habit or a "nicer" default, the rule wins. If the user explicitly asks for something a rule forbids, do what the user asked, for that element only.

## 1. No subtext unless the user asks for it

Subtext means any secondary line of text that explains, describes, encourages, or elaborates on a primary element.

**Never add, unless the user specified it for that element:**
- descriptions under headings, titles, or card names
- eyebrow and kicker labels above headings ("YOUR PATH", "DAILY BOOST", "WEEKLY ACTIVITY")
- helper or hint text ("One quick lesson will complete your goal")
- motivational or encouraging copy ("Keep that brilliant streak alive!")
- empty-state paragraphs (an icon plus a few words is enough)
- tooltips that restate the visible label
- captions, footers, or attributions on cards
- placeholder text that explains a field when the label already does

If an element seems to need explanation, make the icon or label clearer. Don't add a sentence.

When unsure whether something counts as subtext, leave it out. The user will ask for it if they want it.

## 2. Icon-first, minimal words

- Lead every interactive or navigational element with an icon.
- Labels are one or two words: "Home", "Learn", "Practice". Not "Start learning now".
- Buttons are a verb, or icon only: "Continue", or an arrow by itself.
- Show numbers and statuses with icon + value ("🔥 12"), not a phrase ("12 day streak").
- Use one icon set across the whole app: **Tabler Icons** (`@tabler/icons-react`). Don't mix icon libraries or styles, and no emoji in place of icons.
- Icon-only buttons need an `aria-label`. That's for accessibility, not visible text, so it's always required.

**Approved examples** (from `reference/ui-demo.png`):
- **Sidebar nav:** icon + one word per item.
- **Unit rows** in "Pick up where you left off": number tile with an icon, unit label, title, short description, lesson count and time with small icons, progress bar, arrow button. Unit rows are the one place the user has approved a one-line description.

## 2a. daisyUI first

- Use daisyUI 5's prebuilt components (`btn`, `card`, `menu`, `progress`, `steps`, `badge`, `alert`, `modal`, `dropdown`, `toggle`, `join`, `drawer`, `navbar`, `stat`, `loading`, etc.) whenever one fits. Load the `daisyui:daisyui` skill before writing markup.
- Build a custom component **only if absolutely necessary**, meaning no daisyUI component or combination of components does the job (e.g., the camera + landmark canvas). When you do, say why in the component's doc file.
- Style through daisyUI's theme tokens and modifiers before adding custom Tailwind. Don't restyle a daisyUI component into something else.

## 3. Common AI frontend patterns to avoid

- Gradient hero banners with a headline, paragraph, and CTA by default
- Greeting headers ("Good morning, Alex!") unless asked for
- Decorative illustrations, floating shapes, sparkles, or blurred blobs
- Emoji used as decoration in copy
- Exclamation points and cheerful filler copy
- Badges or pills for everything ("New", "Beta", "Popular")
- Padding out a layout with extra cards so it looks full. Empty space is allowed and preferred.
- Adding upsells, CTAs, or quotes nobody asked for
- Repeating the same destination in several places (e.g., a Profile nav link plus a user card plus a header avatar). Keep one entry point per destination unless told otherwise.
- Stat cards that wrap a single number in a heading, a caption, and a trend line
- Inventing features, sections, or copy that aren't in the agreed feature list

## 4. Scope source of truth

The agreed feature list is `reference/ui-demo-features.md`. Build only items marked `[keep]`. Don't build `[later]` or `[cut]` items, and don't add anything that isn't listed. If something seems missing, ask instead of adding it.

## 5. Self-check before finishing

For every text node you added, ask:
1. Did the user ask for this text? If not, is it a label of one or two words?
2. Could an icon replace it or carry most of its meaning?
3. Does it explain something the element already shows?

If a text node fails, remove it.
