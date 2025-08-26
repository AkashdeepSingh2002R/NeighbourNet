import React, { useEffect, useState } from "react";
import { useNavigate, NavLink, useLocation, Link } from "react-router-dom";

export default function Navbar({ onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleLogoutClick = () => {
    onLogout();
    navigate("/welcome");
  };

  const linkBase =
    "block px-4 py-2 rounded hover:bg-green-50 text-green-800 transition";
  const linkActive = "text-green-900 font-semibold";

  const renderLinks = (extra = "") => (
    <>
      <NavLink to="/home" className={({ isActive }) => `${linkBase} ${extra} ${isActive ? linkActive : ""}`}>Home</NavLink>
      <NavLink to="/communities" className={({ isActive }) => `${linkBase} ${extra} ${isActive ? linkActive : ""}`}>Communities</NavLink>
      <NavLink to="/weather" className={({ isActive }) => `${linkBase} ${extra} ${isActive ? linkActive : ""}`}>Weather</NavLink>
      <NavLink to="/rentals" className={({ isActive }) => `${linkBase} ${extra} ${isActive ? linkActive : ""}`}>Rentals</NavLink>
      <button onClick={handleLogoutClick} className={`ml-0 md:ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ${extra}`}>
        Logout
      </button>
    </>
  );

  return (
    <nav className="bg-green-100 px-4 md:px-6 py-3 shadow-md relative">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link className="text-xl font-bold text-green-900">NeighbourNet</Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-2">{renderLinks()}</div>

        {/* Hamburger button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded p-2 text-green-900 focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown panel (put ABOVE overlay via z-index) */}
      <div
        className={`md:hidden transition-[max-height] duration-300 overflow-hidden ${
          open ? "max-h-96" : "max-h-0"
        } relative z-50`}
      >
        <div className="mt-2 border-t border-green-200 pt-2 flex flex-col gap-1">
          {renderLinks("w-full text-left")}
        </div>
      </div>

      {/* Click-away overlay (BELOW panel) */}
      {open && (
        <button
          aria-hidden
          tabIndex={-1}
          className="fixed inset-0 md:hidden z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}
    </nav>
  );
}
