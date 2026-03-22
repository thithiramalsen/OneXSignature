import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
  }`;

const AppNavbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <NavLink to="/dashboard" className="text-lg font-bold text-primary-700 whitespace-nowrap">
            OneX Signature
          </NavLink>
          <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/documents" className={linkClass}>Documents</NavLink>
            <NavLink to="/signatures" className={linkClass}>Signatures</NavLink>
            <NavLink to="/signed-documents" className={linkClass}>Signed Docs</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin/users" className={linkClass}>User Management</NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-gray-600 max-w-[220px] truncate">
            {user?.full_name}
          </span>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-2 rounded-md text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="md:hidden border-t border-gray-100 px-3 py-2 flex items-center gap-1 overflow-x-auto bg-white">
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/documents" className={linkClass}>Documents</NavLink>
        <NavLink to="/signatures" className={linkClass}>Signatures</NavLink>
        <NavLink to="/signed-documents" className={linkClass}>Signed Docs</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin/users" className={linkClass}>Users</NavLink>
        )}
      </div>
    </header>
  );
};

export default AppNavbar;
