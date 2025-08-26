// client/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, boot, children }) {
  // Don't redirect while we're restoring the session
  if (boot) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600">
        Restoring session…
      </div>
    );
  }
  return user ? children : <Navigate to="/welcome" replace />;
}
