import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ConnectionStatus from './components/ConnectionStatus';
import Login from './pages/Login';
import Register from './pages/Register';
import Mood from './pages/Mood';
import Journal from './pages/Journal';
import Mindfulness from './pages/Mindfulness';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';
import Chat from './pages/Chat';
import Testing from './pages/Testing';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navigation />
          <ConnectionStatus />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Mood />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <Journal />
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
            </Routes>
          </main>
          {/* Make sure ToastContainer is here */}
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
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
