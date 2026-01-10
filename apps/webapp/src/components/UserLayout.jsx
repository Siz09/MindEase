'use client';

import React from 'react';

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ChatSidebar from './ChatSidebar';
import ConnectionStatus from './ConnectionStatus';
import '../styles/UserLayout.css';
import { useTheme } from '../contexts/ThemeContext';

export const SidebarContext = React.createContext({
  sidebarOpen: true,
  setSidebarOpen: () => {},
});

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme } = useTheme();
  const location = useLocation();

  // Only chat routes have a sidebar (ChatSidebar with chat history)
  // All other pages have NO sidebar - navigation is through navbar only
  const isChatRoute = location.pathname.startsWith('/chat');

  // Determine layout class based on route and sidebar state
  const getLayoutClass = () => {
    if (!isChatRoute) {
      return 'no-sidebar'; // No sidebar on non-chat pages
    }
    return sidebarOpen ? 'sidebar-open' : 'sidebar-closed';
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="app-layout" data-theme={theme}>
        {/* ChatSidebar with chat history ONLY on chat routes */}
        {isChatRoute && <ChatSidebar />}
        <div className={`layout-container ${getLayoutClass()}`}>
          <Navbar />
          <ConnectionStatus />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
