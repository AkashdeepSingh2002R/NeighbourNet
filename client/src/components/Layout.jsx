import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ onLogout }) {
  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235] flex flex-col">
      <Navbar onLogout={onLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
