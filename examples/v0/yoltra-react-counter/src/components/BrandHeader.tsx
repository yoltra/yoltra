import { Button } from "@yoltra/ds";
import { useTheme } from "@yoltra/ds/client";

/**
 * Yoltra brand header — mirrors the website's SiteNav: logo mark + wordmark on
 * the left, a light/dark toggle on the right. Shared shell across the examples.
 */
export function BrandHeader() {
  const { theme, toggle } = useTheme();

  return (
    <header className="app-header">
      <a className="app-header__brand" href="https://yoltra.dev" title="Yoltra">
        <img src="/logo.svg" width={28} height={28} alt="Yoltra" />
        <span>Yoltra</span>
      </a>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggle}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? "🌞" : "🌙"}
      </Button>
    </header>
  );
}
