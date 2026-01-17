
import React, { useState } from 'react';
import { User, Role, PermissionSet } from '../types';

interface AdminPanelProps {
  users: User[];
  roles: Role[];
  onAddUser: (user: User) => void;
  onUpdateRole: (role: Role) => void;
  currentUserId: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ users, roles, onAddUser, onUpdateRole, currentUserId }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // User Form State
  const [userForm, setUserForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    roleId: roles[0]?.id || ''
  });

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.firstName || !userForm.lastName || !userForm.email || !userForm.phone || !userForm.username) {
      alert("Please fill in all required fields marked with *");
      return;
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      ...userForm,
      fullName: `${userForm.firstName} ${userForm.middleName ? userForm.middleName + ' ' : ''}${userForm.lastName}`.trim()
    };
    onAddUser(newUser);
    setIsAddingUser(false);
    setUserForm({
      firstName: '',
      middleName: '',
      lastName: '',
      email: '',
      phone: '',
      username: '',
      roleId: roles[0]?.id || ''
    });
  };

  const togglePermission = (role: Role, key: keyof PermissionSet) => {
    const updatedRole: Role = {
      ...role,
      permissions: {
        ...role.permissions,
        [key]: !role.permissions[key]
      }
    };
    onUpdateRole(updatedRole);
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 bg-white p-1 rounded-2xl border border-slate-200 w-fit shadow-sm">
        <button 
          onClick={() => setActiveSubTab('users')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          User Registry
        </button>
        <button 
          onClick={() => setActiveSubTab('roles')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeSubTab === 'roles' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Access Controls
        </button>
      </div>

      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Identity Management</h3>
              <p className="text-slate-500 font-medium">Provision system access and manage organizational identities.</p>
            </div>
            <button 
              onClick={() => setIsAddingUser(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <i className="fas fa-plus"></i> Provision New User
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="px-10 py-5">Full Legal Name</th>
                  <th className="px-10 py-5">System Username</th>
                  <th className="px-10 py-5">Communication</th>
                  <th className="px-10 py-5">Security Role</th>
                  <th className="px-10 py-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">
                      <div>
                        <p className="text-sm font-black text-slate-800">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-black">{u.firstName} {u.lastName}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-xs font-mono bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold">@{u.username}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="text-[11px] font-bold text-slate-600">
                        <p className="flex items-center gap-2 mb-1"><i className="fas fa-envelope text-slate-300"></i>{u.email}</p>
                        <p className="flex items-center gap-2"><i className="fas fa-phone text-slate-300"></i>{u.phone}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                        {roles.find(r => r.id === u.roleId)?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-emerald-600">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Security Provisioning</h3>
              <p className="text-slate-500 font-medium">Define which modules are visible for each functional role.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {roles.map(role => (
              <div key={role.id} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-100">
                      <i className="fas fa-user-shield"></i>
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800">{role.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Profile</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-800">{users.filter(u => u.roleId === role.id).length}</span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identities</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-3">Provisioned Screens</p>
                  
                  {[
                    { key: 'dashboard', label: 'Dashboard Module', icon: 'fa-chart-pie' },
                    { key: 'documents', label: 'Document Repository', icon: 'fa-folder-open' },
                    { key: 'templates', label: 'Blueprint Manager', icon: 'fa-scroll' },
                    { key: 'admin', label: 'Administration Suite', icon: 'fa-users-cog' }
                  ].map(screen => (
                    <div key={screen.key} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${role.permissions[screen.key as keyof PermissionSet] ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                          <i className={`fas ${screen.icon}`}></i>
                        </div>
                        <span className="text-sm font-black text-slate-700">{screen.label}</span>
                      </div>
                      <button 
                        onClick={() => togglePermission(role, screen.key as keyof PermissionSet)}
                        className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${role.permissions[screen.key as keyof PermissionSet] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${role.permissions[screen.key as keyof PermissionSet] ? 'left-8' : 'left-1'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in fade-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-100">
                  <i className="fas fa-id-card"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">Identity Provisioning</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">New System Account</p>
                </div>
              </div>
              <button onClick={() => setIsAddingUser(false)} className="w-10 h-10 rounded-full hover:bg-white text-slate-400 hover:text-slate-800 transition-all shadow-sm"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleAddUserSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name *</label>
                  <input required value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder-slate-300" placeholder="Required" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Middle Name</label>
                  <input value={userForm.middleName} onChange={e => setUserForm({...userForm, middleName: e.target.value})} type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder-slate-300" placeholder="Optional" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name *</label>
                  <input required value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 placeholder-slate-300" placeholder="Required" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address *</label>
                  <div className="relative">
                    <i className="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} type="email" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" placeholder="user@company.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number *</label>
                  <div className="relative">
                    <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input required value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} type="tel" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900" placeholder="555-0199" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Username *</label>
                  <input required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} type="text" className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900" placeholder="username" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Role Assignment</label>
                  <select value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 appearance-none">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-8 flex justify-end gap-5">
                <button type="button" onClick={() => setIsAddingUser(false)} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all">Dismiss</button>
                <button type="submit" className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200 hover:bg-blue-600 transition-all">Finalize & Provision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
