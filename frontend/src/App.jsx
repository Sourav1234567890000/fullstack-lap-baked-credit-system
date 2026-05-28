import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ApplicantProvider } from "./context/ApplicantContext";

// Core Dashboard Pages
import LoginPage from "./pages/LoginPage";
import LAPDashboard from "./pages/LAPDashboard";
import CardMintingPage from "./pages/CardMinting";

// In App.jsx or your Router logic
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Authenticating...</div>; // Prevent premature redirect
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

// Centralized Router Definition Array
const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/lap",
      element: (
        <ProtectedRoute>
          <LAPDashboard />
        </ProtectedRoute>
      ),
    },
    {
      path: "/minting",
      element: (
        <ProtectedRoute>
          <CardMintingPage />
        </ProtectedRoute>
      ),
    },
  ],
  {
    future: { v7_startTransition: true },
  },
);


function App() {
  return (
    <AuthProvider>
      <ApplicantProvider>
        {/* Global Toast Management for stage success/error messages */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0e1322",
              color: "#fff",
              border: "1px solid #1e293b",
            },
          }}
        />

        {/* Mount Active Router Structure */}
        <RouterProvider router={router} />
      </ApplicantProvider>
    </AuthProvider>
  );
}

export default App;
