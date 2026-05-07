import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import CandidateList from "./pages/CandidateList";
import CandidateDetail from "./pages/CandidateDetail";
import StatsPanel from "./pages/StatsPanel";
import LoginPage from "./pages/LoginPage";
import { isAuthenticated } from "./api/candidates";

// ── Auth Guard ────────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CandidateList />} />
          <Route path="candidate/:id" element={<CandidateDetail />} />
          <Route path="stats" element={<StatsPanel />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}