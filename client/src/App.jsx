import React, { useEffect, useState } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

// pages
import LandingLogin from "./pages/LandingLogin";
import Home from "./pages/Home";
import Communities from "./pages/Communities";
import WeatherPage from "./pages/WeatherPage";
import Rentals from "./pages/Rentals";
import RentalDetail from "./pages/RentalDetail";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";
import Messages from "./pages/Messages";
import Notifications from "./pages/Notifications";

export default function App() {
  const [user, setUser] = useState(null);

  // bootstrap user from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("user") || "null");
      if (saved?._id) setUser(saved);
    } catch {}
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("user");
    } catch {}
    setUser(null);
  };

  // router
  const router = createBrowserRouter([
    // welcome/login page WITHOUT Layout (so no navbar)
    {
      path: "/welcome",
      element: <LandingLogin onLogin={setUser} />,
    },

    // everything else uses Layout (navbar + footer)
    {
      path: "/",
      element: <Layout onLogout={handleLogout} />,
      children: [
        // redirect root based on auth
        { index: true, element: user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace /> },

        { path: "home", element: (
            <ProtectedRoute user={user}>
              <Home />
            </ProtectedRoute>
          ) },

        { path: "communities", element: (
            <ProtectedRoute user={user}>
              <Communities />
            </ProtectedRoute>
          ) },

        { path: "weather", element: (
            <ProtectedRoute user={user}>
              <WeatherPage />
            </ProtectedRoute>
          ) },

        { path: "rentals", element: (
            <ProtectedRoute user={user}>
              <Rentals />
            </ProtectedRoute>
          ) },
        { path: "rentals/:id", element: (
            <ProtectedRoute user={user}>
              <RentalDetail />
            </ProtectedRoute>
          ) },

        { path: "profile", element: (
            <ProtectedRoute user={user}>
              <Profile />
            </ProtectedRoute>
          ) },

        { path: "explore", element: (
            <ProtectedRoute user={user}>
              <Explore />
            </ProtectedRoute>
          ) },

        { path: "messages", element: (
            <ProtectedRoute user={user}>
              <Messages />
            </ProtectedRoute>
          ) },

        { path: "notifications", element: (
            <ProtectedRoute user={user}>
              <Notifications />
            </ProtectedRoute>
          ) },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
