import { NavLink, Outlet } from "react-router";

export function Layout() {
  const linkStyle: React.CSSProperties = { marginRight: 12 };
  const active: React.CSSProperties = { textDecoration: "underline" };

  return (
    <div>
      <nav style={{ marginBottom: 16 }}>
        <NavLink to="/" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? active : {}) })}>
          Home
        </NavLink>
        <NavLink to="/yoltra" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? active : {}) })}>
          Yoltra
        </NavLink>
        <NavLink to="/redux" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? active : {}) })}>
          Redux Toolkit
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}