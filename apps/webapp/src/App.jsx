import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import './index.css';

export default function App() {
  const { t } = useTranslation();

  return (
    <AuthProvider>
      <Router>
        <div style={{ padding: '0 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <Navigation />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

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
      <input placeholder={t('chat.placeholder')} style={{ width: '100%', padding: '12px', marginBottom: '8px' }} />
      <button>{t('action.send')}</button>
    </div>
  );
}
