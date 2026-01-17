
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import DocumentModal from './components/DocumentModal';
import AdminPanel from './components/AdminPanel';
import TemplateManager from './components/TemplateManager';
import { User, UserRole, DocumentMetadata, DocStatus, Classification, EventLog, DocumentVersion, DocumentTemplate, Role } from './types';
import { MOCK_USERS, INITIAL_DOCS, INITIAL_ROLES } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [docs, setDocs] = useState<DocumentMetadata[]>(INITIAL_DOCS);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Admin Module State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username === usernameInput.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      const userRole = roles.find(r => r.id === foundUser.roleId);
      // Auto-redirect to the first available tab based on permissions
      if (userRole?.permissions.dashboard) setActiveTab('dashboard');
      else if (userRole?.permissions.documents) setActiveTab('documents');
      else if (userRole?.permissions.admin) setActiveTab('admin');
    } else {
      alert('Identity not found. Try "admin1", "admin2", "manager", or "user".');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    setSearchQuery('');
  };

  const addEventLog = (documentId: string, action: EventLog['action'], comment?: string) => {
    if (!user) return;
    const newLog: EventLog = {
      id: `log-${Date.now()}`,
      documentId,
      userId: user.id,
      userName: user.fullName,
      action,
      timestamp: new Date().toISOString(),
      comment
    };
    setEventLogs(prev => [newLog, ...prev]);
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
    addEventLog('N/A', 'CREATE_USER', `Added user identity: ${newUser.fullName}`);
  };

  const handleUpdateRole = (updatedRole: Role) => {
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    addEventLog('N/A', 'UPDATE_ROLE', `Updated permissions for: ${updatedRole.name}`);
  };

  const saveDocument = (meta: Partial<DocumentMetadata>) => {
    if (selectedDoc) {
      setDocs(docs.map(d => {
        if (d.id === selectedDoc.id) {
          const snapshot: DocumentVersion = {
            version: d.version,
            timestamp: new Date().toISOString(),
            updatedBy: user!.id,
            userName: user!.fullName,
            meta: { ...d, versions: [] }
          };
          return { ...d, ...meta, version: d.version + 1, versions: [snapshot, ...d.versions] };
        }
        return d;
      }));
      addEventLog(selectedDoc.id, 'UPDATE');
    } else {
      const newDocId = `doc-${Date.now()}`;
      const newDoc: DocumentMetadata = {
        id: newDocId,
        name: meta.name || 'Untitled',
        type: meta.type || 'application/octet-stream',
        classification: meta.classification || Classification.INTERNAL,
        status: DocStatus.DRAFT, 
        uploadedBy: user?.id || 'unknown',
        uploadedAt: new Date().toISOString(),
        size: meta.size || 0,
        description: meta.description,
        customerId: meta.customerId,
        previewUrl: meta.previewUrl,
        version: 1,
        versions: [],
        tags: meta.tags || [],
        expirationDate: meta.expirationDate
      };
      setDocs([newDoc, ...docs]);
      addEventLog(newDocId, 'UPLOAD', 'New document created in DRAFT state');
    }
    setIsModalOpen(false);
    setSelectedDoc(null);
  };

  const deleteDocument = (docId: string) => {
    setDocs(docs.filter(d => d.id !== docId));
    addEventLog(docId, 'DELETE', 'Draft document discarded');
    setIsModalOpen(false);
    setSelectedDoc(null);
  };

  const submitForReview = (docId: string) => {
    setDocs(docs.map(d => d.id === docId ? { ...d, status: DocStatus.PENDING } : d));
    addEventLog(docId, 'SUBMIT', 'Moved from DRAFT to IN REVIEW');
    setIsModalOpen(false);
    setSelectedDoc(null);
  };

  const handleReviewAction = (docId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION', comment?: string) => {
    const doc = docs.find(d => d.id === docId);
    if (doc && doc.uploadedBy === user!.id) {
      alert("Conflict of Interest: You cannot review your own uploads.");
      return;
    }

    let nextStatus: DocStatus = DocStatus.ACTIVE;
    if (action === 'REJECT') nextStatus = DocStatus.REJECTED;
    if (action === 'REQUEST_REVISION') nextStatus = DocStatus.NEEDS_REVISION;

    setDocs(docs.map(d => d.id === docId ? { ...d, status: nextStatus, reviewedBy: user!.id, reviewedAt: new Date().toISOString(), comments: comment } : d));
    addEventLog(docId, action, comment);
    setIsModalOpen(false);
    setSelectedDoc(null);
  };

  const handleRevert = (docId: string, version: DocumentVersion) => {
    setDocs(docs.map(d => {
      if (d.id === docId) {
        const snapshot: DocumentVersion = { version: d.version, timestamp: new Date().toISOString(), updatedBy: user!.id, userName: user!.fullName, comment: `Rollback to v${version.version}`, meta: { ...d, versions: [] } };
        return { ...d, ...version.meta, version: d.version + 1, versions: [snapshot, ...d.versions] };
      }
      return d;
    }));
    addEventLog(docId, 'REVERT', `Document restored to Version ${version.version}`);
    setIsModalOpen(false);
    setSelectedDoc(null);
  };

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const query = searchQuery.toLowerCase();
    return docs.filter(doc => doc.name.toLowerCase().includes(query) || (doc.customerId && doc.customerId.toLowerCase().includes(query)));
  }, [docs, searchQuery]);

  const stats = useMemo(() => ({
    total: docs.length,
    pending: docs.filter(d => d.status === DocStatus.PENDING).length,
    active: docs.filter(d => d.status === DocStatus.ACTIVE).length,
    needsRevision: docs.filter(d => d.status === DocStatus.NEEDS_REVISION).length,
    myDrafts: docs.filter(d => d.status === DocStatus.DRAFT && d.uploadedBy === user?.id).length
  }), [docs, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10">
          <div className="p-12 text-center bg-slate-50 border-b border-slate-100">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-blue-200">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">DocuVault Pro</h1>
            <p className="text-slate-500 font-medium">Secure Identity Gateway</p>
          </div>
          <form onSubmit={handleLogin} className="p-12 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Access</label>
              <input required type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} placeholder="admin1 / manager / user" className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Pass</label>
              <input type="password" placeholder="••••••••" className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Verify & Enter</button>
          </form>
        </div>
      </div>
    );
  }

  const currentUserRole = roles.find(r => r.id === user.roleId);

  return (
    <Layout user={user} roles={roles} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-layer-group"></i></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Assets</p><p className="text-3xl font-black text-slate-800">{stats.total}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-hourglass-half"></i></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Review</p><p className="text-3xl font-black text-slate-800">{stats.pending}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-file-signature"></i></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Drafts</p><p className="text-3xl font-black text-slate-800">{stats.myDrafts}</p></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-check-double"></i></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validated Docs</p><p className="text-3xl font-black text-slate-800">{stats.active}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-sm">
             <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><i className="fas fa-history text-blue-500"></i> Corporate Audit Ledger</h3>
             <div className="space-y-6">
               {eventLogs.slice(0, 8).map(log => (
                 <div key={log.id} className="flex gap-6 items-start">
                   <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                   <div className="flex-1 border-b border-slate-50 pb-6">
                     <p className="text-xs font-black uppercase text-slate-800">{log.action}</p>
                     <p className="text-xs text-slate-400 mt-1 font-medium">{log.userName} • {log.comment || 'System standard activity'}</p>
                   </div>
                 </div>
               ))}
               {eventLogs.length === 0 && <p className="text-center py-20 text-slate-300 font-bold italic uppercase tracking-[0.2em] text-xs">Awaiting log entries</p>}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black text-slate-800">Global Repository</h1>
            <button onClick={() => { setSelectedDoc(null); setIsModalOpen(true); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-slate-200">
              <i className="fas fa-upload mr-2"></i> Ingest Document
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="px-10 py-5">Asset Descriptor</th>
                  <th className="px-10 py-5 text-center">Lifecycle</th>
                  <th className="px-10 py-5 text-right">Interaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredDocs.map(doc => (
                  <tr key={doc.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setSelectedDoc(doc); setIsModalOpen(true); }}>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><i className="fas fa-file-alt"></i></div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{doc.customerId || 'System'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">{doc.status}</span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <i className="fas fa-chevron-right text-slate-200 group-hover:text-blue-500 transition-colors"></i>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'templates' && <TemplateManager templates={templates} currentUserId={user.id} currentUserRole={UserRole.MANAGER} onSave={(tpl) => setTemplates(prev => prev.find(t => t.id === tpl.id) ? prev.map(t => t.id === tpl.id ? tpl : t) : [...prev, tpl])} onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} />}
      
      {activeTab === 'admin' && (
        <AdminPanel 
          users={users} 
          roles={roles} 
          currentUserId={user.id} 
          onAddUser={handleAddUser} 
          onUpdateRole={handleUpdateRole} 
        />
      )}

      {isModalOpen && (
        <DocumentModal 
          document={selectedDoc} 
          templates={templates} 
          users={users}
          currentUserId={user.id} 
          currentUserRole={UserRole.MANAGER} 
          onClose={() => { setIsModalOpen(false); setSelectedDoc(null); }} 
          onSave={saveDocument} 
          onDelete={deleteDocument} 
          onSubmitReview={submitForReview} 
          onReviewAction={handleReviewAction} 
          onRevert={handleRevert} 
          eventLogs={eventLogs.filter(l => l.documentId === selectedDoc?.id)} 
        />
      )}
    </Layout>
  );
};

export default App;
