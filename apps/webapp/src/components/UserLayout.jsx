'use client';

import React from 'react';

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
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

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="app-layout" data-theme={theme}>
        <Sidebar />
        <div className={`layout-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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
