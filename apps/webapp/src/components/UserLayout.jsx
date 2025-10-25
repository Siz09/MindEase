'use client';

import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import ConnectionStatus from './ConnectionStatus';

export default function UserLayout() {
  return (
    <div className="app">
      <Navigation />
      <ConnectionStatus />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
