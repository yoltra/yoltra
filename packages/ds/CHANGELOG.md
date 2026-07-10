# Change Log - @yoltra/ds

This log was last generated on Fri, 10 Jul 2026 07:51:29 GMT and should not be manually modified.

## 0.1.0
Fri, 10 Jul 2026 07:51:29 GMT

### Minor changes

- Initial release of @yoltra/ds — the Yoltra Design System, the shared visual language for the website, documentation, and examples. Ships foundation tokens (a 10-step color palette anchored on brand blue #1A7FE2, typography on Inter + JetBrains Mono, and spacing / radius / elevation / motion scales), light and dark semantic themes that map those primitives to intent-based roles (background / foreground / border / interactive / status), a themeCss() generator that emits --yl-* CSS custom properties for both themes plus base component styles, and primitive React components: Button, ButtonLink, Badge, Callout, Table (with THead/TBody/TR/TH/TD), CodeBlock, and Tabs. Theming is driven entirely by a data-theme attribute on the document root, so components resolve colors through CSS variables and render on the server without a React context.

### Patches

- Split interactive components behind a dedicated "@yoltra/ds/client" subpath entry (ThemeProvider, useTheme, applyTheme, CodeBlock, Tabs) that carries the "use client" directive, so the default "@yoltra/ds" entry stays safe to import from React Server Components (for themeCss() and the static primitives). The package "exports" map declares both "." and "./client", each with types + import + require conditions.

