import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Mindfulness from './pages/Mindfulness';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import UserLayout from './components/UserLayout';

import AdminRoute from './admin/AdminRoute';
import AdminLayout from './admin/AdminLayout';
import { AdminAuthProvider } from './admin/AdminAuthContext';
import AuditLogs from './admin/pages/AuditLogs';
import CrisisFlags from './admin/pages/CrisisFlags';
import CrisisMonitoring from './admin/pages/CrisisMonitoring';
import AdminSettings from './admin/pages/Settings';
import Dashboard from './admin/pages/Dashboard';
import UserManagement from './admin/pages/UserManagement';
import ContentLibrary from './admin/pages/ContentLibrary';
import Analytics from './admin/pages/Analytics';
import SystemMonitoring from './admin/pages/SystemMonitoring';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';
import './styles/ToastOverrides.css';
import Chat from './pages/Chat';
import Testing from './pages/Testing';
import Notifications from './pages/Notifications';
import Subscription from './pages/Subscription';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import Profile from './pages/Profile';

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <AuthProvider>
          <Routes>
            {/* Auth routes (always light theme) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Admin routes (use dedicated admin styling, not user theme) */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="crisis-monitoring" element={<CrisisMonitoring />} />
              <Route path="content" element={<ContentLibrary />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="system" element={<SystemMonitoring />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="crisis-flags" element={<CrisisFlags />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* User routes (wrapped in ThemeProvider so dark/light applies only here) */}
            <Route
              element={
                <ThemeProvider>
                  <UserLayout />
                </ThemeProvider>
              }
            >
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
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
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              {/* Chat route with optional chatId parameter */}
              <Route
                path="/chat/:chatId?"
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
        </AuthProvider>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;
