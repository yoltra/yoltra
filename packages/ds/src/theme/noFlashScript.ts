/**
 * Where the chosen theme is remembered.
 *
 * @remarks
 * Shared by {@link client!ThemeProvider | ThemeProvider} and {@link noFlashScript} from one place, because the two must
 * agree: a script that reads one key while the provider writes another restores nothing, and does
 * so silently. A consuming project hit the other side of this, writing its own key and finding a
 * theme set by a neighbouring application on the same origin was not remembered.
 *
 * @public
 */
export const THEME_STORAGE_KEY = "yoltra-theme";

export interface NoFlashScriptOptions {
  /**
   * The `localStorage` key. Defaults to {@link THEME_STORAGE_KEY}.
   *
   * @remarks
   * {@link client!ThemeProvider | ThemeProvider} always reads and writes {@link THEME_STORAGE_KEY}
   * and takes no key of its own, so alongside the provider leave this unset: a script that reads
   * a different key restores nothing, silently. Set it only when the application persists the
   * theme itself, with {@link client!applyTheme | applyTheme} and a key of its own.
   */
  storageKey?: string;
}

/**
 * The script that sets the theme before the first paint.
 *
 * @remarks
 * `ThemeProvider` reads `localStorage` in an effect, which runs after the browser has already
 * painted. Between those two moments the document shows whatever the server rendered, so a reader
 * who chose dark gets a white flash on every navigation.
 *
 * The only fix is to set the attribute synchronously, before the body renders, which means an
 * inline script. This package documented that and shipped no artifact for it; a consuming project
 * wrote its own and another simply flashed.
 *
 * Inline it in the document head, before any stylesheet:
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: noFlashScript() }} />
 * </head>
 * ```
 *
 * It falls back to `prefers-color-scheme` when nothing is stored, and is wrapped in `try` because
 * reading `localStorage` throws outright in a browser configured to block site data. A theme that
 * fails to restore is a preference lost; an exception here is a blank page.
 *
 * @public
 */
export function noFlashScript({ storageKey = THEME_STORAGE_KEY }: NoFlashScriptOptions = {}): string {
  // Written as one line on purpose: it is inlined into a document, and a readable version would
  // ship its own indentation to every visitor.
  return (
    `(function(){try{var t=localStorage.getItem(${JSON.stringify(storageKey)});` +
    `if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}` +
    `document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`
  );
}
