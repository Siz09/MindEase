import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
// user layout now lives under a separate shell
import Login from './pages/Login';
import Register from './pages/Register';
import CheckIn from './pages/CheckIn';
import Insights from './pages/Insights';
import Mindfulness from './pages/Mindfulness';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import UserLayout from './components/UserLayout';

// Admin-only subtree (separate shell)
import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import Overview from './admin/pages/Overview';
import AuditLogs from './admin/pages/AuditLogs';
import CrisisFlags from './admin/pages/CrisisFlags';
import AdminSettings from './admin/pages/Settings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';
import Chat from './pages/Chat';
import Testing from './pages/Testing';
import Notifications from './pages/Notifications';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin app — separate shell and routes */}
          <Route
            path="/admin/*"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="crisis-flags" element={<CrisisFlags />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* User app — uses user layout with navbar */}
          <Route element={<UserLayout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <CheckIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <Insights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <Navigate to="/" replace />
                </ProtectedRoute>
              }
            />
            {/* Existing code */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mindfulness"
              element={
                <ProtectedRoute>
                  <Mindfulness />
                </ProtectedRoute>
              }
            />
            <Route
              path="/testing"
              element={
                <ProtectedRoute>
                  <Testing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute>
                  <Subscription />
                </ProtectedRoute>
              }
            />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>

        {/* Toasts */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
