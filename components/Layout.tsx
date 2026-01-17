
import React, { ReactNode } from 'react';
import { Role, User } from '../types';

interface LayoutProps {
  children: ReactNode;
  user: User;
  roles: Role[];
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, roles, onLogout, activeTab, setActiveTab, searchQuery, onSearchChange }) => {
  const userRole = roles.find(r => r.id === user.roleId);
  const permissions = userRole?.permissions || { dashboard: false, documents: false, templates: false, admin: false };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', visible: permissions.dashboard },
    { id: 'documents', label: 'Documents', icon: 'fa-folder-open', visible: permissions.documents },
    { id: 'templates', label: 'Templates', icon: 'fa-scroll', visible: permissions.templates },
    { id: 'admin', label: 'Administration', icon: 'fa-users-cog', visible: permissions.admin },
  ];

  const filteredMenuItems = menuItems.filter(item => item.visible);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <i className="fas fa-shield-halved text-xl"></i>
          </div>
          <span className="font-bold text-xl tracking-tight">DocuVault Pro</span>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-slate-800/50 m-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center font-bold text-blue-400">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{userRole?.name}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search repository..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-80 transition-all outline-none"
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
