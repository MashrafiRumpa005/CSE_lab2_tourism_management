import { useEffect, useState } from "react";
import { Compass, LogOut, MapPin, Menu, UserCircle, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logOut } from "../lib/api.js";

const links = [
  { label: "Home", to: "/", hash: "#home" },
  { label: "Destinations", to: "/destinations" },
  { label: "Packages", to: "/packages" },
  { label: "My Bookings", to: "/my-bookings" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("farflung_user") ?? "null"); } catch { return null; }
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(({ user: currentUser }) => { setUser(currentUser); localStorage.setItem("farflung_user", JSON.stringify(currentUser)); })
      .catch(() => { setUser(null); localStorage.removeItem("farflung_user"); });
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);
  const isActive = (link) =>
    location.pathname === link.to ||
    (link.to === "/my-bookings" && location.pathname === "/bookings") ||
    (link.hash && location.hash === link.hash);

  const handleLogout = async () => {
    await logOut();
    setUser(null);
    localStorage.removeItem("farflung_user");
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-brand" onClick={closeMenu}>
          <Compass size={25} />
          <span>Farflung</span>
        </Link>

        <nav className="site-nav" aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className={isActive(link) ? "active" : ""}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-header-actions">
          <span className="site-departure"><MapPin size={15} /> Dhaka, BD</span>
          {user ? (
            <div className="site-account-actions">
              {user.role === "admin" && <Link to="/admin" className="site-admin-link">Admin</Link>}
              <Link to="/profile" className="site-profile-link" aria-label="Open profile"><UserCircle size={22} /><span>{user.fullName}</span></Link>
              <button type="button" className="site-logout-button" onClick={handleLogout} aria-label="Log out"><LogOut size={17} /></button>
            </div>
          ) : <><Link to="/login">Log in</Link><Link to="/signup" className="site-register">Register</Link></>}
        </div>

        <button type="button" className="site-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" aria-expanded={menuOpen}>
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {menuOpen && (
        <div className="site-mobile-menu">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className={isActive(link) ? "active" : ""} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          <div className="site-mobile-actions">
            {user ? <>{user.role === "admin" && <Link to="/admin" onClick={closeMenu}>Admin console</Link>}<Link to="/profile" onClick={closeMenu}>My profile</Link><button type="button" className="site-mobile-logout" onClick={handleLogout}><LogOut size={16} /> Log out</button></> : <><Link to="/login" onClick={closeMenu}>Log in</Link><Link to="/signup" className="site-register" onClick={closeMenu}>Register</Link></>}
          </div>
        </div>
      )}
    </header>
  );
}