import { NavLink, Outlet } from "react-router";
import { Button } from "@yoltra/ds";
import { useTheme } from "@yoltra/ds/client";
import "./Layout.css";

export function Layout() {
  const { theme, toggle } = useTheme();

  return (
    <div className="yl-root app-shell">
      <header className="app-header">
        <a className="app-header__brand" href="https://yoltra.dev" title="Yoltra">
          <img src="/logo.svg" width={28} height={28} alt="Yoltra" />
          <span>Yoltra</span>
        </a>

        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "is-active" : undefined)}>
            Home
          </NavLink>
          <NavLink to="/yoltra" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
            Yoltra
          </NavLink>
          <NavLink to="/redux" className={({ isActive }) => (isActive ? "is-active" : undefined)}>
            Redux Toolkit
          </NavLink>
        </nav>

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

      <main className="yl-container app-main">
        <Outlet />
      </main>
    </div>
  );
}
