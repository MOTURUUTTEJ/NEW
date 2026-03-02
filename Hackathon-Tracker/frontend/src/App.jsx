import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import TeamDashboard from './pages/TeamDashboard';
import ProjectDetails from './pages/ProjectDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminTeamsList from './pages/AdminTeamsList';
import AdminTeamDetail from './pages/AdminTeamDetail';
import Welcome from './pages/Welcome';
import { AdminProvider } from './context/AdminContext';

const RedirectToLanding = () => {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  window.location.href = '/landing/index.html';
  return null;
};

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400 font-medium">Loading…</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<RedirectToLanding />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<Login isAdmin={true} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/register" element={<Register isAdmin={true} />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <TeamDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/hackathon/:hackathonId"
            element={
              <ProtectedRoute>
                <ProjectDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminProvider>
                  <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="teams" element={<AdminTeamsList />} />
                    <Route path="teams/:id" element={<AdminTeamDetail />} />
                  </Routes>
                </AdminProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
