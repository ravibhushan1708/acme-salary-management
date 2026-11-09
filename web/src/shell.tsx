import { Button } from "@mantine/core";
import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "./session";

export function AppShell() {
  const { user, logout } = useSession();

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <strong>ACME</strong>
          <span>Pay ledger</span>
        </div>
        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Pay questions
          </NavLink>
          <NavLink to="/people" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            People
          </NavLink>
        </nav>
        <div className="rail-footer">
          <p className="name">{user?.name}</p>
          <p className="role">HR manager</p>
          <Button variant="white" color="dark" size="xs" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
