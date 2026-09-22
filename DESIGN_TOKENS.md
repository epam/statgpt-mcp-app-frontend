# Design tokens

The host (Claude, ChatGPT, or any other MCP Apps host) delivers CSS custom
properties on `hostContext.styles.variables` during the `ui/initialize`
handshake, and again on every `ui/notifications/host-context-changed`
(theme toggle, resize, etc). This widget wires a defined subset of them
into its own styling. This doc tracks exactly which tokens are consumed,
where, and with what fallback. Keep it in sync with the code as the
wiring changes; it documents current behavior, not a historical decision
record.

## Colors

Consumed in `src/styles/colors.scss`, which aliases every host
`--color-*` token onto this app's own internal design-system variable
names (`--neutrals-*`, `--semantic-*`, `--ring-primary`), each with a
literal fallback:

```scss
--neutrals-1000: var(--color-text-primary, #2b2b2d);
--neutrals-900:  var(--color-text-secondary, #3f404a);
--neutrals-800:  var(--color-text-tertiary, #757575);
/* ...and so on for --neutrals-700 down to -100, --ring-primary,
   --semantic-error/-warning/-success/-info */
```

Note the host exposes three text levels (`primary`/`secondary`/`tertiary`)
but this app's `--neutrals-*` scale has more steps than that, so
`--neutrals-800` and `--neutrals-700` both alias to the same
`--color-text-tertiary` token.

AG Grid gets its own separate mapping in `src/styles/global.scss`'s
`.ag-theme-quartz` block (`--ag-background-color`, `--ag-foreground-color`,
`--ag-border-color`, etc. — same host tokens, AG's own variable names).

The `light-dark()` CSS function is load-bearing here: the same file's
fallbacks intentionally don't adapt to the OS/host theme on their own
(documented in `colors.scss`'s own header comment as an accepted
limitation — every host observed so far always pairs `theme` with a full
token set, so this only matters if that assumption ever breaks). Separately,
AG Grid's own Theming API re-declares `color-scheme` inside its rendering
scope, which breaks `light-dark()` resolution for anything inside the
grid body unless overridden — fixed by `.ag-root-wrapper { color-scheme:
inherit; }` in the same `.ag-theme-quartz` block.

## Border radius & width

Consumed the same way — `colors.scss` aliases the host's `--border-radius-*`/
`--border-width-regular` onto this app's own `--radius-*`/`--border-width`
names, which `tailwind.config.js`'s `theme.extend.borderRadius`/
`borderWidth` then point Tailwind's own `rounded-*`/`border` utilities at:

```scss
--radius-xs: var(--border-radius-xs, 4px);
/* ...through --radius-full */
--border-width: var(--border-width-regular, 1px);
```

## Fonts

The host sends: `--font-sans`, `--font-mono`,
`--font-weight-{normal,medium,semibold,bold}`,
`--font-text-{xs,sm,md,lg}-size`/`-line-height`, and
`--font-heading-{xs,sm,md,lg,xl,2xl,3xl}-size`/`-line-height`.

Two independent scales exist (`text-*` for body copy, `heading-*` for
headings) because which one applies to a given piece of text depends on
its *role*, not its rendered size — a constraint that shapes how the
mapping below is done.

| Token | Consumed at | Fallback |
|---|---|---|
| `--font-sans` | `global.scss`: `body { font-family }`, `.ag-theme-quartz { --ag-font-family, --ag-header-font-family }` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` |
| `--font-mono` | **nowhere** | — |
| `--font-weight-normal` | `tailwind.config.js` `fontWeight.normal` (every `font-normal` utility, app-wide) + `fonts.scss` `.caption` | `400` |
| `--font-weight-medium` | `tailwind.config.js` `fontWeight.medium` (every `font-medium` utility, app-wide) | `500` |
| `--font-weight-semibold` | `tailwind.config.js` `fontWeight.semibold` (every `font-semibold` utility, app-wide) + `fonts.scss` `.h4` + `global.scss`'s `.ag-theme-quartz { --ag-header-font-weight }` | `600` |
| `--font-weight-bold` | `tailwind.config.js` `fontWeight.bold` (every `font-bold` utility, app-wide) | `700` |
| `--font-text-xs-size`/`-line-height` | `fonts.scss` `.caption`; `global.scss`'s `.ag-theme-quartz { --ag-font-size, --ag-line-height, --ag-header-font-size }` (grid cells + header); `tailwind.config.js` `fontSize['token-xs']`/`['token-xs-size']` (size-only variant, no bundled line-height) — used by `DimensionsList.tsx`'s dimension value, `ChartPager.tsx`'s page counter, and several other small labels/hints | 12px / 16px, except `.caption`'s own fallback (10px/16px, its pre-existing size) and the grid header's own fallback (13px, AG Grid's own pre-existing default) |
| `--font-text-sm-size`/`-line-height` | `tailwind.config.js` `fontSize['token-sm']` — used by several body-copy spots across the components | 14px / 20px |
| `--font-heading-xs-size`/`-line-height` | `fonts.scss` `.h4` — reserved for genuine heading-shaped content only (currently just `ChartView.tsx`'s dataset title) | 12px / 16px |
| `--font-heading-sm-size`/`-line-height` | `tailwind.config.js` `fontSize['token-heading-sm']` — used by one fullscreen header | 16px / 24px |
| `--font-text-md-size`/`-lg-size`, `--font-heading-{md,lg,xl,2xl,3xl}-size` | **nowhere** — no call site currently needs these tiers | — |

Weight didn't need per-call-site mapping the way size did: the host's
weight names match Tailwind's own weight scale name-for-name, and weight
doesn't depend on a text's role the way size does, so one global
`tailwind.config.js` change covers every `font-*` utility, present and
future. Size can't be globalized the same way — mapping it requires
knowing whether a given span is a heading or body copy, which a blind
remap of Tailwind's own `xs`/`sm`/`base` keys can't express.

That role distinction is also why `.h4` isn't used for every bold small
label — `DimensionsList.tsx`'s dimension value and `ChartPager.tsx`'s page
counter look similar to `.h4` visually (small, semibold) but aren't
headings, so they're mapped onto the `text-*` scale (`text-token-xs`)
instead of the `heading-*` scale. On Claude these two scales are
numerically identical at matching tier names, so the distinction is
invisible there — but they diverge sharply on ChatGPT, whose `heading-xs`
is noticeably larger than its `text-xs`, where using the wrong scale for
non-heading text would make it grow far more than intended.

A handful of typography classes in `fonts.scss` (`.h1`, `.h2`, `.h3`,
`.h5`, `.body-1`, `.body-2`, `.body-3`) are dead code — nothing in the
app currently renders them — and are intentionally left hardcoded rather
than wired to tokens that would have no effect.
