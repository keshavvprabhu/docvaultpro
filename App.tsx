
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import DocumentModal from './components/DocumentModal';
import AdminPanel from './components/AdminPanel';
import TemplateManager from './components/TemplateManager';
import { User, UserRole, DocumentMetadata, DocStatus, Classification, EventLog, DocumentVersion, DocumentTemplate } from './types';
import { MOCK_USERS, INITIAL_DOCS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [docs, setDocs] = useState<DocumentMetadata[]>(INITIAL_DOCS);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = MOCK_USERS.find(u => u.username === usernameInput.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      // Redirect Admin to management page by default as they don't handle documents
      if (foundUser.role === UserRole.ADMIN) {
        setActiveTab('admin');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      alert('User not found. Try "admin", "manager", "user", or "guest".');
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
          return { 
            ...d, 
            ...meta, 
            version: d.version + 1,
            versions: [snapshot, ...d.versions] 
          };
        }
        return d;
      }));
      addEventLog(selectedDoc.id, 'UPDATE');
    } else {
      const newDocId = `doc-${Date.now()}`;
      const newDoc: DocumentMetadata = {
        id: newDocId,
        name: meta.name || 'Untitled',
        type: meta.type || (meta.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
        classification: meta.classification || Classification.INTERNAL,
        status: DocStatus.DRAFT, 
        uploadedBy: user?.id || 'unknown',
        uploadedAt: new Date().toISOString(),
        size: meta.size || Math.floor(Math.random() * 5000000),
        description: meta.description,
        customerId: meta.customerId,
        previewUrl: meta.previewUrl || (meta.name?.toLowerCase().endsWith('.pdf') ? 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=400&auto=format&fit=crop' : undefined),
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
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    if (doc.status !== DocStatus.DRAFT) {
      alert("Only draft documents can be deleted.");
      return;
    }
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
    if (!user) return;
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) return;
    
    const doc = docs.find(d => d.id === docId);
    if (doc && doc.uploadedBy === user.id) {
      alert("Conflict of Interest: You cannot review a document you uploaded.");
      return;
    }

    let nextStatus: DocStatus = DocStatus.ACTIVE;
    if (action === 'REJECT') nextStatus = DocStatus.REJECTED;
    if (action === 'REQUEST_REVISION') nextStatus = DocStatus.NEEDS_REVISION;

    setDocs(docs.map(d => d.id === docId ? {
      ...d,
      status: nextStatus,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
      comments: comment
    } : d));
    
    addEventLog(docId, action, comment);
    setIsModalOpen(false);
    setSelectedDoc(null);
  };

  const handleRevert = (docId: string, version: DocumentVersion) => {
    if (user?.role === UserRole.GUEST) return;
    setDocs(docs.map(d => {
      if (d.id === docId) {
        const snapshot: DocumentVersion = {
          version: d.version,
          timestamp: new Date().toISOString(),
          updatedBy: user!.id,
          userName: user!.fullName,
          comment: `Rollback to v${version.version}`,
          meta: { ...d, versions: [] }
        };
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
    return docs.filter(doc => 
      doc.name.toLowerCase().includes(query) ||
      (doc.customerId && doc.customerId.toLowerCase().includes(query)) ||
      doc.classification.toLowerCase().includes(query) ||
      (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  }, [docs, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: docs.length,
      pending: docs.filter(d => d.status === DocStatus.PENDING).length,
      active: docs.filter(d => d.status === DocStatus.ACTIVE).length,
      needsRevision: docs.filter(d => d.status === DocStatus.NEEDS_REVISION).length,
      myDrafts: docs.filter(d => d.status === DocStatus.DRAFT && d.uploadedBy === user?.id).length
    };
  }, [docs, user]);

  const reviewQueue = useMemo(() => {
    // Admins do not participate in document review by default
    if (user?.role === UserRole.MANAGER) {
      return docs.filter(d => d.status === DocStatus.PENDING && d.uploadedBy !== user.id);
    }
    if (user?.role === UserRole.USER) {
      return docs.filter(d => d.status === DocStatus.NEEDS_REVISION && d.uploadedBy === user?.id);
    }
    return [];
  }, [docs, user]);

  const getStatusStyle = (status: DocStatus) => {
    switch (status) {
      case DocStatus.ACTIVE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case DocStatus.PENDING: return 'bg-amber-100 text-amber-700 border-amber-200';
      case DocStatus.DRAFT: return 'bg-slate-100 text-slate-700 border-slate-200';
      case DocStatus.NEEDS_REVISION: return 'bg-purple-100 text-purple-700 border-purple-200';
      case DocStatus.REJECTED: return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getClassificationColor = (c: Classification) => {
    switch (c) {
      case Classification.RESTRICTED: return 'bg-red-100 text-red-700 border-red-200';
      case Classification.CONFIDENTIAL: return 'bg-orange-100 text-orange-700 border-orange-200';
      case Classification.INTERNAL: return 'bg-blue-100 text-blue-700 border-blue-200';
      case Classification.PUBLIC: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const renderThumbnail = (doc: DocumentMetadata, sizeClasses = "w-10 h-10") => {
    if (doc.previewUrl) {
      return (
        <div className={`${sizeClasses} rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0`}>
          <img src={doc.previewUrl} alt={doc.name} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${sizeClasses} bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200`}>
        <i className="fas fa-file-alt text-slate-400 text-lg"></i>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10">
          <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
              <i className="fas fa-shield-halved"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">DocuVault Pro</h1>
            <p className="text-slate-500 font-medium">Enterprise Document Repository</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Identity</label>
              <input 
                type="text" 
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="admin / manager / user / guest"
                className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input type="password" placeholder="••••••••" className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">Access Vault</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab} searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-layer-group"></i></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase">Total Items</p><p className="text-2xl font-black text-slate-800">{stats.total}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-hourglass-half"></i></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase">Review Queue</p><p className="text-2xl font-black text-slate-800">{stats.pending}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-file-signature"></i></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase">My Drafts</p><p className="text-2xl font-black text-slate-800">{stats.myDrafts}</p></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-check-double"></i></div>
              <div><p className="text-xs font-bold text-slate-400 uppercase">Active</p><p className="text-2xl font-black text-slate-800">{stats.active}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <i className="fas fa-clipboard-list text-blue-500"></i>
                {user.role === UserRole.USER ? 'Items Requiring Revision' : (user.role === UserRole.ADMIN ? 'Global System Activity' : 'Approval Workflow Queue')}
              </h3>
              
              {user.role === UserRole.ADMIN ? (
                <div className="text-center py-20 text-slate-400">
                  <i className="fas fa-user-shield text-5xl mb-4 opacity-20"></i>
                  <p className="font-bold">Administrators focus on User Management.</p>
                  <p className="text-xs mt-1">Visit the Administration tab for user provisioning.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewQueue.slice(0, 5).map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 cursor-pointer" onClick={() => { setSelectedDoc(doc); setIsModalOpen(true); }}>
                      {renderThumbnail(doc, "w-12 h-12")}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">UPLOADED BY: {MOCK_USERS.find(u => u.id === doc.uploadedBy)?.fullName || 'Unknown'}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                  {reviewQueue.length === 0 && (
                    <div className="text-center py-20 text-slate-300">
                      <i className="fas fa-coffee text-5xl mb-4 opacity-20"></i>
                      <p className="font-bold">Queue is empty. Everything is up to date.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><i className="fas fa-clock-rotate-left text-blue-500"></i> Audit Feed</h3>
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                {eventLogs.slice(0, 10).map(log => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-slate-100">
                    <div className="absolute -left-[7px] top-0 w-3 h-3 bg-white border-2 border-blue-500 rounded-full"></div>
                    <p className="text-[11px] font-bold text-slate-800">{log.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.userName} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                ))}
                {eventLogs.length === 0 && <p className="text-center text-xs text-slate-300 py-10 italic">No system events recorded.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documents' && user.role !== UserRole.ADMIN && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-slate-800">Master Repository</h1>
            {user.role !== UserRole.GUEST && (
              <button onClick={() => { setSelectedDoc(null); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">
                <i className="fas fa-upload"></i> New Ingestion
              </button>
            )}
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4 text-center">Security</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map(doc => (
                    <tr key={doc.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedDoc(doc); setIsModalOpen(true); }}>
                          {renderThumbnail(doc)}
                          <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[10px] font-black text-slate-400 tracking-widest uppercase">{doc.customerId || 'GLOBAL'}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${getClassificationColor(doc.classification)}`}>{doc.classification}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(doc.status)}`}>{doc.status}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => { setSelectedDoc(doc); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600"><i className="fas fa-chevron-right"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && user.role !== UserRole.ADMIN && <TemplateManager templates={templates} currentUserId={user.id} currentUserRole={user.role} onSave={(tpl) => setTemplates(prev => prev.find(t => t.id === tpl.id) ? prev.map(t => t.id === tpl.id ? tpl : t) : [...prev, tpl])} onDelete={(id) => setTemplates(prev => prev.filter(t => t.id !== id))} />}
      {activeTab === 'admin' && <AdminPanel />}

      {isModalOpen && (
        <DocumentModal 
          document={selectedDoc} 
          templates={templates} 
          currentUserId={user.id} 
          currentUserRole={user.role} 
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
