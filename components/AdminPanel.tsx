
import React, { useState } from 'react';
// Fix: Import User and UserRole types from types.ts, as they are not exported from constants.ts
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    // In a real app, this would persist to a backend
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.MANAGER: return 'bg-blue-100 text-blue-700 border-blue-200';
      case UserRole.USER: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case UserRole.GUEST: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">User Access Control</h3>
            <p className="text-sm text-slate-500">Manage organizational roles and system permissions.</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            <i className="fas fa-user-plus mr-2"></i>
            Invite New User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">User</th>
                <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Role</th>
                <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Status</th>
                <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">Last Activity</th>
                <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none transition-all ${getRoleColor(user.role)}`}
                    >
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      Active
                    </span>
                  </td>
                  <td className="py-4 text-xs text-slate-500 font-medium">
                    2 hours ago
                  </td>
                  <td className="py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">
              <i className="fas fa-history"></i>
            </div>
            <h4 className="font-bold text-slate-800">Security Audit Logs</h4>
          </div>
          <p className="text-sm text-slate-500 mb-4">View comprehensive history of all administrative actions and logins.</p>
          <button className="text-blue-600 font-bold text-sm hover:underline">View All Logs →</button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-xl">
              <i className="fas fa-key"></i>
            </div>
            <h4 className="font-bold text-slate-800">Access Policies</h4>
          </div>
          <p className="text-sm text-slate-500 mb-4">Configure IP whitelisting and multi-factor authentication requirements.</p>
          <button className="text-blue-600 font-bold text-sm hover:underline">Configure Policies →</button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl">
              <i className="fas fa-microchip"></i>
            </div>
            <h4 className="font-bold text-slate-800">System Integration</h4>
          </div>
          <p className="text-sm text-slate-500 mb-4">Manage API keys and external directory service synchronization.</p>
          <button className="text-blue-600 font-bold text-sm hover:underline">Manage Integrations →</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
