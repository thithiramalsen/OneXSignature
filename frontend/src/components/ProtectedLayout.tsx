import React from 'react';
import { Outlet } from 'react-router-dom';
import AppNavbar from './AppNavbar';

const ProtectedLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <AppNavbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;
