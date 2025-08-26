// client/src/App.jsx
import React, { useEffect, useState } from "react";
import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";
import api from "./api/axios";

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
import Events from "./pages/Events"; // ✅ NEW

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("user") || "null");
      return saved?._id ? saved : null;
    } catch {
      return null;
    }
  });

  const [boot, setBoot] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/users/me");
        if (!cancelled && data?._id) {
          setUser(data);
          try { localStorage.setItem("user", JSON.stringify(data)); } catch {}
        }
      } catch {
        // keep localStorage user if present
      } finally {
        if (!cancelled) setBoot(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("user"); localStorage.removeItem("token"); } catch {}
    setUser(null);
  };

  const router = createBrowserRouter([
    { path: "/welcome", element: <LandingLogin onLogin={(u) => {
        setUser(u);
        try { localStorage.setItem("user", JSON.stringify(u)); } catch {}
      }} /> },

    {
      path: "/",
      element: <Layout onLogout={handleLogout} />,
      children: [
        {
          index: true,
          element: boot
            ? <div className="min-h-[40vh] flex items-center justify-center text-gray-600">Restoring session…</div>
            : (user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />)
        },

        { path: "home", element:
          <ProtectedRoute user={user} boot={boot}><Home /></ProtectedRoute>
        },
        { path: "communities", element:
          <ProtectedRoute user={user} boot={boot}><Communities /></ProtectedRoute>
        },
        { path: "weather", element:
          <ProtectedRoute user={user} boot={boot}><WeatherPage /></ProtectedRoute>
        },
        { path: "rentals", element:
          <ProtectedRoute user={user} boot={boot}><Rentals /></ProtectedRoute>
        },
        { path: "rentals/:id", element:
          <ProtectedRoute user={user} boot={boot}><RentalDetail /></ProtectedRoute>
        },
        { path: "profile", element:
          <ProtectedRoute user={user} boot={boot}><Profile /></ProtectedRoute>
        },
        { path: "explore", element:
          <ProtectedRoute user={user} boot={boot}><Explore /></ProtectedRoute>
        },
        { path: "messages", element:
          <ProtectedRoute user={user} boot={boot}><Messages /></ProtectedRoute>
        },
        { path: "notifications", element:
          <ProtectedRoute user={user} boot={boot}><Notifications /></ProtectedRoute>
        },

       
        { path: "events", element:
          <ProtectedRoute user={user} boot={boot}><Events /></ProtectedRoute>
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
