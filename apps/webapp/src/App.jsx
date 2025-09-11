import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import MoodPage from './pages/Mood';
import JournalPage from './pages/Journal';
import './index.css';

// Temporary components for protected routes
function HomePage() {
  const { t } = useTranslation();
  return (
    <div>
      <h2>Welcome to MindEase</h2>
      <p>Your mental wellness journey starts here.</p>
    </div>
  );
}

function ChatPage() {
  const { t } = useTranslation();
  return (
    <div>
      <h2>{t('nav.chat')}</h2>
      <input
        placeholder={t('chat.placeholder')}
        style={{ width: '100%', padding: '12px', marginBottom: '8px' }}
      />
      <button>{t('action.send')}</button>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <Navigation />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mood"
                element={
                  <ProtectedRoute>
                    <MoodPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/journal"
                element={
                  <ProtectedRoute>
                    <JournalPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AuthProvider>
  );
}
