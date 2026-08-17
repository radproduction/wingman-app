---
type: Note
---
# Component inventory

Companion to [readme.md](readme.md). This is the **roster**: every repeatable piece of UI the
Wingman app draws, named, located, and classified. It is the input to the component documentation
and to the React Native build order.

## How this was derived

Wingman has no `ds/` folder. The design system is real but implicit: it lives in 178 `wg-` and `wm-`
class families across `app.css` (6,000 lines) plus six area stylesheets and the shell sheets, and in
the 20 components already published to the Figma library. This inventory was produced by:

1. Extracting every class family defined in `app/src/app/*.css`, `app/src/shell/*.css` and
   `app/src/pwa/*.css`.
2. Counting, for each one, how many `.tsx` files reference it by exact token match, which separates a
   shared component from a one-screen block.
3. Reading the block comment above each definition, since the stylesheet already names most of these
   things in plain language.
4. Cross-referencing the published Figma keys in [figma-library-keys.md](../figma-library-keys.md).

Nothing here was invented. If a component is in this list it is because the app draws it.

## How to read the tables

| Column | Meaning |
|---|---|
| **Class family** | The `wg-`/`wm-` root the component is styled from |
| **Component** | The name it gets in the design system |
| **Defined** | Stylesheet and line of the first definition |
| **Used by** | Number of `.tsx` files that reference it. 1 means it is drawn in one place today. |
| **Figma** | The published component in the library, where one exists |
| **RN** | `yes` crosses to React Native, `web` is a browser mechanism that stops at the boundary |

A **Used by** count of 1 does not mean "not a component". Several of these are drawn once because
there is one screen of that kind so far, and they are still the anatomy the native app has to match.
What it does change is build order: the high-count rows are what a native developer needs on day one.

---

## Tier A: primitives

The shared vocabulary. These appear across the whole app and are the first things to build.

| Class family | Component | Defined | Used by | Figma | RN |
|---|---|---|---|---|---|
| `wg-btn` | Button | app.css:998 | 37 | Button | yes |
| `wg-chip` | Chip | app.css:2596 | 32 | Chip | yes |
| `wg-option`, `wg-options` | Option Row, Option List | app.css:1105 | 14 | Option Row | yes |
| `wg-field` | Field | app.css:1330 | 10 | Field | yes |
| `wg-seg` | Segmented | app.css:1455 | 9 | Segmented | yes |
| `wg-switch` | Switch | app.css:1254 | 1 (`shell/Switch.tsx`) | Switch | yes |
| `wg-link` | Inline link action | app.css:979 | 4 | | yes |
| `wg-note` | Inline text button | app.css:970 | 2 | | yes |
| `wg-code` | Code Box | app.css:1386 | 2 | Code Box | yes |
| `wg-dots` | Page Dots | app.css:1957 | 1 | Page Dots | yes |
| `wg-track`, `wg-steps` | Progress track, step progress | app.css:873 | 2 | Progress | yes |
| `wg-avatar`, `wg-face` | Avatar, illustrated portrait | app.css:2115, 4472 | 2 | | yes |
| `wg-tag` | Tag | app.css:2165 | 2 | | yes |
| `wg-cap` | Caption above a control | app.css:1652 | 1 | | yes |
| `wg-sect` | Section heading | app.css:2243 | 1 | | yes |
| `wg-slider` | Stepped slider | app.css:1761 | 1 | | yes |
| `wg-skel` | Skeleton | app.css:3108 | 4 | | yes |
| `wg-empty` | Empty state | app.css:3725 | 3 | | yes |
| `wg-footnote` | Footnote under a group | app.css:4360 | 23 | | yes |
| `wg-flag` | Tone label pill | dashboard.css:298 | 2 | | yes |
| `wg-state` | State pill | intelligence.css:102 | 1 | | yes |
| `wg-mstatus` | Status pill | business.css:215 | 3 | | yes |
| (n/a) | Icon | `app/icons.tsx` | app-wide | icon/* (51) | yes |
| (n/a) | Chat Bubble | Figma only | 0 | Chat Bubble | decide |

**One row still needs a decision before it is documented.** `Chat Bubble` is in the Figma library
but has no code behind it; it is either revived deliberately or marked retired in the library, and
it is not documented as if the app draws it.

**Ring Gauge is retired** (product owner, 2026-08-15). It was replaced on Home by the Today's
Snapshot card in [D-023], no code renders it, and it is no longer a roster entry here or on the
docs surface. The Figma library still publishes the `Ring Gauge` set; its row in
[figma-library-keys.md](../figma-library-keys.md) gets flagged retired on the next gated
`code-to-figma` pass rather than edited by hand.

## Tier B: shell, navigation, and overlay

| Class family | Component | Defined | Used by | Figma | RN |
|---|---|---|---|---|---|
| `wg-screen` | Screen scaffold | app.css:780 | 10 | | yes |
| `wg-panel`, `wg-pane`, `wg-panes` | Scroll panel, pane, pane group | app.css:2982, 1916, 1901 | 8 | | yes |
| `wg-appbar`, `wg-brand`, `wg-wa`, `wg-bell` | App header, wing mark, channel chip, notification bell | app.css:2023 | 4 | Top Bar | yes |
| `wg-subbar`, `wg-sub` | Detail-layer back bar | app.css:4089 | 7 | Top Bar | yes |
| `wg-topbar`, `wg-back`, `wg-glyph` | Onboarding top bar, back button | app.css:844 | 2 | | yes |
| `wg-nav` | Tab bar | app.css:4976 | 1 (`shell/TabBar.tsx`) | Nav Bar, Nav Item | yes |
| `wm-sheet` | Bottom sheet | app.css:5188 | 10 | | yes |
| `wm-ap` | Sheet action list | app.css:5335 | 2 | | yes |
| `wg-asheet` | Capture sheet | dashboard.css:618 | 1 | | yes |
| `wm-toast` | Toast | app.css:5389 | 1 (`shell/toast.tsx`) | Toast | yes |
| `wg-actions`, `wg-act` | Bottom action bar, inline approval action | app.css:942, 5122 | 5 | | yes |
| `wg-body`, `wg-content`, `wg-main`, `wg-h1` | Step screen body, content column, heading | app.css:916, 923, 817, 907 | 2 | | yes |
| `wg-pull` | Pull-to-refresh spacer | app.css:3190 | 1 | | yes |
| `wg-splash`, `wg-welcome` | Splash and intro | app.css:1888, 934 | 2 | | yes |
| `wm-stack`, `wm-screen` | Screen stack and slide transition | app-shell.css:171, 191 | 2 | | contract only |
| `wg-nc` | Not-connected screen | app.css:1666 | 1 | | yes |
| `wg-illo` | Illustration tile | app.css:1926 | 1 | | yes |

`wm-stack` and `wm-screen` cross as a **motion contract**, not as code: the direction, duration,
easing and distance of a push and a pop are design decisions the native navigator has to reproduce.
The mechanism behind them (two alternating slot layers, a monotonic history index) exists only
because the browser Back button does not say which way it went, and it does not cross.

## Tier C: structure and layout

| Class family | Component | Defined | Used by | RN |
|---|---|---|---|---|
| `wg-card-line` | Card hairline (D-031) | app.css | 40+ call sites | yes |
| `wg-set`, `wg-set-list` | Setting row, setting list | app.css:4282 | 8 | yes |
| `wg-group` | Grouped setting rows | app.css:1409 | 2 | yes |
| `wg-row` | List row | app.css:1415 | 2 | yes |
| `wg-mrow` | Module row, one anatomy across all five module screens | app.css:4448 | 2 | yes |
| `wg-grid` | Tile grid | app.css:2625 | 3 | yes |
| `wg-tile` | Bento tile | app.css:2631 | 1 | yes (Figma: Bento Tile) |
| `wg-gal` | Gallery | dashboard.css:516 | 3 | yes |
| `wg-reveal` | Reveal | app.css:3492 | 1 | yes |
| `wg-notice` | Notice | app.css:4137 | 1 | yes |
| `wg-filters` | Filter row | app.css:5597 | 1 | yes |
| `wg-mfilter` | Filter chip rail | business.css:108 | 2 | yes |
| `wg-msearch` | Search field | business.css:135 | 2 | yes |
| `wg-foot` | Group footer | app.css | 24 | yes |
| `wg-scopes` | Permission scope list | app.css:5941 | 2 | yes |
| `wg-icons`, `wg-icon` | App icon picker | app.css:1585, 1596 | 1 | yes |
| `wg-themes`, `wg-theme` | Theme picker | app.css:1483, 1495 | 1 | yes |
| `wg-lang` | Language row with flag | app.css:1142 | 1 | yes |

**Finding worth flagging.** There is no `Card` component. `wg-card` is defined once as a shared
status card (app.css:2675) and `wg-card-line` is a **hairline utility** applied to 40-plus different
blocks. In other words the app has a card *treatment* (surface, radius, hairline, shadow) that many
different components wear, not one card component that everything nests inside. The React Native
documentation should express that the same way, as a surface style applied to a component, rather
than inventing a `<Card>` wrapper the web app does not have. Getting this wrong is the fastest way
for the native build to drift.

## Tier D: screen patterns

Drawn on one screen or one family of screens. Documented so the native build has the anatomy, and
ordered by area rather than by usage count.

**Home and dashboard (13)**

| Class family | Component | Defined |
|---|---|---|
| `wg-wgrid` | Widget canvas grid | dashboard.css:55 |
| `wg-wgt` | Widget cell | dashboard.css:70 |
| `wg-wlist`, `wg-wrow` | Rows inside a widget | dashboard.css:181, 186 |
| `wg-wtick` | In-place row completion tick | dashboard.css:272 |
| `wg-wempty` | Empty widget invitation | dashboard.css:321 |
| `wg-wskel` | Widget-shaped placeholder | dashboard.css:31 |
| `wg-wadd` | Add-a-widget tile | dashboard.css:469 |
| `wg-dempty` | Emptied dashboard canvas | dashboard.css:491 |
| `wg-dedit` | Dashboard edit bar | dashboard.css:341 |
| `wg-dash` | Date line under the greeting | dashboard.css:21 |
| `wg-insight` | Insight and focus card | app.css:2150 |
| `wg-daycard`, `wg-wday` | Today's Snapshot card, Wingman's Day | app.css:2260, 2183 |
| `wg-metrics`, `wg-metric` | Count pills | app.css:2454, 2484 |

**Calendar (10)**

`wg-cal` (surface, app.css:2739), `wg-topnav` (month navigator, 2801), `wg-week` and `wg-monthgrid`
(one cell, two layouts, 2854), `wg-days`, `wg-agenda` (time gutter beside event cards, 3528), `wg-ev`
(event card, 3534), `wg-now` (the now divider, 3689), `wg-peek` (tomorrow peek, 3754), `wg-brief`
(Wingman brief card, 3450).

**Email, tasks, attention (7)**

`wg-mail` (2740), `wg-tasks` (2741), `wg-task` (3940), `wg-notdone` (intelligence.css:284),
`wg-att` (dashboard.css:603), `wg-alog` (approvals log, app.css:5626), `wg-artrow` (5775).

**Module screens: bills, deliveries, travel, people, health (12)**

`wg-mod__hero` (the tapped Home tile restated as the screen header, app.css:4410), `wg-mrow` (the
repeated module row, 4448), `wg-steps` (four plain words for where a thing is, 4589), `wg-parcel`
(4559), `wg-trip` (the one expressive element on Travel, 4662), `wg-hcards` and `wg-hcard`
(health.css:9, 14), `wg-hweek` (week strip, health.css:85), `wg-spark` (sparkline, health.css:66),
`wg-health` (a granted connection undone from the same screen, health.css:141), `wg-account`
(app.css:4736), `wg-conn` (connector row, app.css:4793).

**Business and meetings (21)**

`wg-bc__summary` (the assistant's own read at the top of a screen, business.css:19, used by 17
screens and the single most reused block in the app after the primitives), `wg-integ` (integration
card, 44), `wg-meeting` (meeting row, 162), `wg-mstatus` (215), `wg-live` (the breathing live dot,
249), `wg-mdet` (meeting hero, 291), `wg-mfacts` and `wg-mfact` (two-column facts grid, 323, 331),
`wg-mfaces` and `wg-mface` (attendee faces, 343, 348), `wg-mcontext` (what Wingman already has, 374),
`wg-msteps` (the buttons that move a meeting through its flow, 400), `wg-consent` (506), `wg-confirm`
(required confirmation line, 547), `wg-transcript` (617), `wg-lc` (live controls, 648), `wg-ai`
(action items, 670), `wg-pri` (691), `wg-pa` (proposed actions, 713), `wg-rec` (recorder hero, 805),
`wg-inst` (starting a meeting on the spot, 892), `wg-now` (immediate meeting card, 934), `wg-fig`
and `wg-figs` (the day in three figures, app.css:5857), `wg-brain` (hub row, 5808).

**Mobility (13)**

`wg-tlevel` (traffic level, mobility.css:11), `wg-commute` (Home traffic widget and route head, 34),
`wg-route` (route line and endpoint markers, 134), `wg-tbar` (traffic strip, 245), `wg-mod` facts
grid (272), `wg-tseg` (per-segment list, 294), `wg-alt` (alternative routes, 332), `wg-origin`
(origin banner, 365), `wg-place` (saved places, 396), `wg-seg` mode picker (432), `wg-pick` (colour
and glyph choosers, 465), `wg-days` (workday toggle chips, 554).

**News (6)**

`wg-nlist` and `wg-nrow` (story rows, news.css:10, 15), `wg-tchip` (topic chips, 76), `wg-topics`
(the Following card, 95), `wg-story` (125), `wg-news`.

**Intelligence (5)**

`wg-wday` (the flagship Home widget, intelligence.css:13), `wg-wact` (69), `wg-state` (102),
`wg-used` (information used chips, 184), `wg-tl` (timeline, 288).

**Profile, settings, onboarding (9)**

`wg-prof` (profile hero, app.css:4220), `wg-edit` and `wg-dedit` (one field per screen, 4946),
`wg-signout` (4906), `wg-help` (4371), `wg-article` and `wg-artrow` (help article, 5749),
`wg-mem` (memory rows, 5689), `wg-connect` (connect rows on the ready screen, 1992), `wg-success`
(2009), `wg-preview` (live voice preview, 1862).

## Tier E: does not cross to React Native

Catalogued so nobody rebuilds a browser workaround as if it were a design decision.

| Class family | What it is | Why it stops |
|---|---|---|
| `wm-chrome`, `gh-*` device frame | Faux iOS status bar, Dynamic Island, home indicator | Desktop-only drawing of a phone. The phone is the phone. |
| `wm-install` | PWA install sheet | There is no install prompt in a native app. |
| `wg-orient` | Portrait guard for the installed app | Handled by the app manifest natively. |
| `wm-coming` | Placeholder for unbuilt tabs | Development scaffolding. |
| `wm-stack` slot mechanism | Two alternating layers plus a history index | React Navigation owns the stack. The **motion** crosses, the mechanism does not. |
| `wg-pull` height mechanism | Pull-to-refresh implemented as a growing spacer | RN has `RefreshControl`. |
| Drag-scroll on the panels | Mouse press-drag to imitate a finger | A finger is already a finger. |

---

## Counts

| Tier | Entries |
|---|---|
| A. Primitives | 22 |
| B. Shell, navigation, overlay | 17 |
| C. Structure and layout | 18 |
| D. Screen patterns | 96 |
| E. Does not cross | 7 |
| **Total** | **161 class families, documented as roughly 85 components** once related families are folded together (a family plus its list wrapper, a hero plus its rows) |

## Open questions raised by the audit

1. **Chat Bubble** is published in Figma with no code behind it. Revive or retire? (Ring Gauge had
   the same question and was **retired**, product owner, 2026-08-15.)
2. **`wg-card` versus `wg-card-line`.** Confirm the reading above: the app has a card treatment worn
   by many components rather than a card component. If that is right it belongs in
   `foundations.md` as a surface rule, not in the component list.
3. **`wg-mod` is defined in three stylesheets** (app.css:4410, business.css:924, mobility.css:272).
   Is that one component with three contexts, or three components that collided on a name? It needs
   to be resolved before it is documented, because a native developer will build whatever the doc says.
   **Resolved (2026-08-16, while writing the Module hero page):** one component. The business.css and
   mobility.css occurrences are context rules scoped *under* the module screen's class
   (`.wg-mod .wg-field`, `.wg-mod .wg-mfacts > div`), not second definitions. Documented on
   [components/module-hero.md](components/module-hero.md).
4. **`wg-now` is two different things**: the divider between past and upcoming on Calendar
   (app.css:3689) and the immediate-meeting card in Business (business.css:934). Same name, unrelated
   components. One of them should be renamed before the documentation fixes the collision in place.
