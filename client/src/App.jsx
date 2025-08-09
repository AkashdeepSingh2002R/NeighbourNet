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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; }
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout onLogout={handleLogout} />,
      children: [
        { index: true, element: user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace /> },
        { path: "welcome", element: <LandingLogin onLogin={setUser} /> },
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
        { path: "*", element: <Navigate to="/" replace /> }
      ]
    }
  ]);

  return <RouterProvider router={router} />;
}
