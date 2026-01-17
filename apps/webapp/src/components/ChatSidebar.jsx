'use client';

import { useState, useContext, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  MoreVertical,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { SidebarContext } from './UserLayout';
import { useChatSessions } from '../hooks/useChatSessions';
import Spinner from './ui/Spinner';

/**
 * ChatSidebar - ChatGPT-like sidebar with chat list
 */
const ChatSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { chatId: activeChatId } = useParams();
  const { sidebarOpen, setSidebarOpen } = useContext(SidebarContext);

  const { sessions, loading, error, createSession, deleteSession, updateTitle } = useChatSessions();

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Create new chat
  const handleNewChat = async () => {
    // Don't create new chat if sessions are still loading
    if (loading) {
      return;
    }

    // Helper to check if a session is empty (no messages)
    const isSessionEmpty = (session) => {
      return !session.preview || session.preview.trim() === '';
    };

    // Check if we're already on an empty chat
    if (activeChatId) {
      const activeSession = sessions.find((s) => s.id === activeChatId);
      // If active chat exists and has no preview (empty), don't create a new one
      if (activeSession && isSessionEmpty(activeSession)) {
        // Already on an empty chat, do nothing
        return;
      }
    }

    // Check if the most recent session is empty
    if (sessions.length > 0) {
      const mostRecentSession = sessions[0]; // Sessions are sorted by most recent first (updatedAt desc)
      // If most recent session is empty (no preview), navigate to it instead of creating new
      if (isSessionEmpty(mostRecentSession)) {
        // If we're not already on it, navigate to it
        if (mostRecentSession.id !== activeChatId) {
          navigate(`/chat/${mostRecentSession.id}`);
        }
        // If we're already on it, do nothing
        return;
      }
    }

    // No empty chat found, create a new one
    const newSessionId = await createSession();
    if (newSessionId) {
      navigate(`/chat/${newSessionId}`);
    }
  };

  // Navigate to a chat
  const handleSelectChat = (sessionId) => {
    if (editingId) return;
    navigate(`/chat/${sessionId}`);
    setMenuOpenId(null);
    // Close sidebar on mobile after selecting a chat
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Start editing title
  const handleStartEdit = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || 'New Chat');
    setMenuOpenId(null);
  };

  // Save edited title
  const handleSaveEdit = async (e, sessionId) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await updateTitle(sessionId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  // Cancel editing
  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  // Delete chat
  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    const success = await deleteSession(sessionId);
    setDeletingId(null);
    setMenuOpenId(null);

    // If we deleted the active chat, navigate to /chat
    if (success && sessionId === activeChatId) {
      navigate('/chat');
    }
  };

  // Toggle menu
  const handleToggleMenu = (e, sessionId) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === sessionId ? null : sessionId);
  };

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const groups = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.updatedAt || session.createdAt);
      const sessionDateOnly = new Date(
        sessionDate.getFullYear(),
        sessionDate.getMonth(),
        sessionDate.getDate()
      );
      const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const yesterdayDateOnly = new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      );

      if (sessionDateOnly.getTime() === todayDateOnly.getTime()) {
        groups.today.push(session);
      } else if (sessionDateOnly.getTime() === yesterdayDateOnly.getTime()) {
        groups.yesterday.push(session);
      } else if (sessionDate >= lastWeek) {
        groups.lastWeek.push(session);
      } else if (sessionDate >= lastMonth) {
        groups.lastMonth.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  }, [sessions]);

  const renderSessionItem = (session) => {
    const isActive = session.id === activeChatId;
    const isEditing = editingId === session.id;
    const isMenuOpen = menuOpenId === session.id;
    const isDeleting = deletingId === session.id;

    return (
      <div
        key={session.id}
        className={`group relative flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-200
          ${isActive ? 'bg-calm-100 dark:bg-calm-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
          ${isEditing ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
        onClick={() => handleSelectChat(session.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleSelectChat(session.id)}
      >
        {/* Active indicator */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-calm-500 rounded-r-full" />
        )}

        {/* Icon */}
        <div
          className={`flex-shrink-0 ${isActive ? 'text-calm-600 dark:text-calm-400' : 'text-gray-500'}`}
        >
          <MessageSquare size={18} />
        </div>

        {/* Content */}
        <div className={`flex-1 min-w-0 ${sidebarOpen ? '' : 'hidden'}`}>
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-calm-500 rounded focus:outline-none focus:ring-2 focus:ring-calm-500/20"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(e, session.id);
                  if (e.key === 'Escape') handleCancelEdit(e);
                }}
                autoFocus
              />
              <button
                className="p-1 text-calm-600 hover:bg-calm-100 dark:hover:bg-calm-900/30 rounded"
                onClick={(e) => handleSaveEdit(e, session.id)}
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                onClick={handleCancelEdit}
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <span
              className={`block truncate text-sm ${isActive ? 'font-semibold text-calm-700 dark:text-calm-300' : 'text-gray-700 dark:text-gray-300'}`}
            >
              {session.title || 'New Chat'}
            </span>
          )}
        </div>

        {/* Actions */}
        {!isEditing && sidebarOpen && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity relative">
            <button
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={(e) => handleToggleMenu(e, session.id)}
              title="Options"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={(e) => handleStartEdit(e, session)}
                >
                  <Edit2 size={14} />
                  <span>Rename</span>
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  onClick={(e) => handleDelete(e, session.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Spinner size={14} /> : <Trash2 size={14} />}
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4" key={title}>
        {sidebarOpen && (
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </div>
        )}
        <div className="space-y-1">{items.map(renderSessionItem)}</div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay - Only visible on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="chat-sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 49,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}

      <aside
        className={`fixed left-0 top-[70px] h-[calc(100vh-70px)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-xl
          ${sidebarOpen ? 'w-72 translate-x-0' : 'w-16 -translate-x-full'}
          md:translate-x-0 md:shadow-none
          ${sidebarOpen ? 'md:w-72' : 'md:w-16'}`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={handleNewChat}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 bg-calm-500 hover:bg-calm-600 text-white rounded-lg font-medium text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
            ${sidebarOpen ? 'flex-1' : 'w-10 justify-center'}`}
            title={t('chat.newChat') || 'New Chat'}
          >
            <Plus size={18} />
            {sidebarOpen && <span>{t('chat.newChat') || 'New Chat'}</span>}
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {loading && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              <Spinner size={24} />
              {sidebarOpen && <span className="mt-2 text-sm">Loading chats...</span>}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-32 text-red-500 dark:text-red-400 px-4 text-center">
              <span className="text-sm">{error}</span>
            </div>
          ) : sessions.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 ${sidebarOpen ? 'px-4' : ''}`}
            >
              <MessageSquare size={32} className="mb-2 opacity-50" />
              {sidebarOpen && (
                <>
                  <span className="text-sm font-medium">
                    {t('chat.noChats') || 'No conversations yet'}
                  </span>
                  <span className="text-xs mt-1 opacity-70">
                    {t('chat.startNew') || 'Click "New Chat" to start'}
                  </span>
                </>
              )}
            </div>
          ) : (
            <>
              {renderGroup('Today', groupedSessions.today)}
              {renderGroup('Yesterday', groupedSessions.yesterday)}
              {renderGroup('Previous 7 Days', groupedSessions.lastWeek)}
              {renderGroup('Previous 30 Days', groupedSessions.lastMonth)}
              {renderGroup('Older', groupedSessions.older)}
            </>
          )}
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
