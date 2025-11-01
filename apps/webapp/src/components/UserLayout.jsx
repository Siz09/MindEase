'use client';

import React from 'react';

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ConnectionStatus from './ConnectionStatus';
import '../styles/UserLayout.css';

export const SidebarContext = React.createContext();

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="app-layout">
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
