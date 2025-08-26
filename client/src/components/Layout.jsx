import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
export default function Layout({ onLogout }) {
  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235] flex flex-col">
      {/* Full-width sticky header */}
      <header className="sticky top-0 z-50">
        {/* Let Navbar control its own bg/spacing; don't wrap in max-w */}
        <Navbar onLogout={onLogout} />
      </header>

      {/* Content fills remaining space, page scrolls normally */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Full-width sticky footer at the bottom of the page flow */}
      <footer className="sticky bottom-0 z-40 mt-auto">
        <Footer />
      </footer>
    </div>
  );
}