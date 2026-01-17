
import React, { useState, useRef, useEffect } from 'react';
import { Classification, DocumentMetadata, UserRole, DocStatus, EventLog, DocumentVersion, DocumentTemplate, User } from '../types';
import { analyzeDocumentMetadata } from '../services/geminiService';
import FileViewer from './FileViewer';

interface DocumentModalProps {
  onClose: () => void;
  onSave: (doc: Partial<DocumentMetadata>) => void;
  onDelete?: (docId: string) => void;
  onSubmitReview?: (docId: string) => void;
  document?: DocumentMetadata | null;
  templates?: DocumentTemplate[];
  users: User[];
  currentUserId: string;
  currentUserRole: UserRole;
  onReviewAction: (docId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION', comment?: string) => void;
  onRevert: (docId: string, version: DocumentVersion) => void;
  eventLogs: EventLog[];
}

const DocumentModal: React.FC<DocumentModalProps> = ({ onClose, onSave, onDelete, onSubmitReview, document, templates = [], users, currentUserId, currentUserRole, onReviewAction, onRevert, eventLogs }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'versions'>('details');
  const [showViewer, setShowViewer] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentMetadata>>(
    document || {
      name: '',
      classification: Classification.INTERNAL,
      description: '',
      previewUrl: '',
      customerId: '',
      size: 0,
      type: '',
      tags: [],
      expirationDate: '',
      status: DocStatus.DRAFT,
    }
  );
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{ summary: string; tags: string[]; suggestedClassification: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploader = document?.uploadedBy === currentUserId;
  const isDraft = document?.status === DocStatus.DRAFT;
  const isPendingReview = document?.status === DocStatus.PENDING;
  const isNeedsRevision = document?.status === DocStatus.NEEDS_REVISION;
  
  const canEdit = currentUserRole !== UserRole.GUEST && (!document || isDraft || isNeedsRevision);
  const isManagerOrAdmin = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MANAGER;

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : '';
    setFormData(prev => ({ ...prev, name: file.name, size: file.size, type: file.type, previewUrl: previewUrl || prev.previewUrl }));
  };

  const handleTemplateApply = (templateId: string) => {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;
    setFormData(prev => ({ ...prev, classification: tpl.defaultClassification, description: tpl.defaultDescription, tags: [...new Set([...(prev.tags || []), ...tpl.defaultTags])] }));
  };

  const handleAIAnalyze = async () => {
    if (!formData.name) return;
    setAnalyzing(true);
    setSuggestions(null);
    try {
      const result = await analyzeDocumentMetadata(formData.name, formData.description || '');
      if (result) setSuggestions({ summary: result.summary, tags: result.tags, suggestedClassification: result.suggestedClassification });
    } catch (err) { console.error("AI Analysis failed", err); }
    setAnalyzing(false);
  };

  const applySuggestions = () => {
    if (!suggestions) return;
    setFormData(prev => ({ ...prev, classification: suggestions.suggestedClassification as Classification, description: suggestions.summary, tags: suggestions.tags }));
    setSuggestions(null);
  };

  const getClassificationColor = (c: string) => {
    switch (c) {
      case Classification.RESTRICTED: return 'bg-red-100 text-red-700 border-red-200';
      case Classification.CONFIDENTIAL: return 'bg-orange-100 text-orange-700 border-orange-200';
      case Classification.INTERNAL: return 'bg-blue-100 text-blue-700 border-blue-200';
      case Classification.PUBLIC: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const reviewerName = document?.reviewedBy ? users.find(u => u.id === document.reviewedBy)?.fullName || 'System' : 'Pending Approval';
  const reviewDate = document?.reviewedAt ? new Date(document.reviewedAt).toLocaleString() : 'N/A';

  return (
    <>
      {showViewer && <FileViewer url={formData.previewUrl} name={formData.name || 'Untitled Asset'} onClose={() => setShowViewer(false)} />}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row max-h-[92vh]">
          
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 flex flex-col overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Context</h4>
              <div className="flex gap-1">
                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-200 text-slate-600">v{document?.version || 1}</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${document?.status ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50'}`}>{document?.status || 'INGESTING'}</span>
              </div>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto scrollbar-hide">
              <div className="aspect-[3/4] bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-6 relative group">
                {formData.previewUrl ? <img src={formData.previewUrl} className="w-full h-full object-cover" alt="Preview" /> : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-300 gap-4">
                    <i className="fas fa-file-invoice text-6xl"></i>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Restricted View</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  {!document && canEdit && <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-xs"><i className="fas fa-sync mr-2"></i>Change</button>}
                  {(document || selectedFile) && <button onClick={() => setShowViewer(true)} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"><i className="fas fa-eye mr-2"></i>Secure Inspect</button>}
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-history text-blue-500"></i> Audit logs</h5>
                <div className="space-y-4">
                  {eventLogs.map(log => (
                    <div key={log.id} className="text-[11px] border-l-2 border-slate-200 pl-4 py-1">
                      <p className="font-bold text-slate-800">{log.action}</p>
                      <p className="text-slate-500">{log.userName} • {new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {eventLogs.length === 0 && <p className="text-center text-[10px] text-slate-400 py-4 italic">No history available</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex gap-8">
                <button onClick={() => setActiveTab('details')} className={`text-xl font-black pb-1 border-b-2 transition-all ${activeTab === 'details' ? 'text-slate-800 border-blue-600' : 'text-slate-300 border-transparent'}`}>Metadata Lifecycle</button>
                {document && <button onClick={() => setActiveTab('versions')} className={`text-xl font-black pb-1 border-b-2 transition-all ${activeTab === 'versions' ? 'text-slate-800 border-blue-600' : 'text-slate-300 border-transparent'}`}>Version Ledger</button>}
              </div>
              <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400"><i className="fas fa-times text-lg"></i></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              {activeTab === 'details' ? (
                <>
                  {!document && templates.length > 0 && (
                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400"><i className="fas fa-scroll"></i></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata Blueprint</p><p className="text-xs font-bold text-slate-800">Pre-fill structure</p></div>
                      </div>
                      <select onChange={(e) => handleTemplateApply(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-black text-slate-900" defaultValue=""><option value="" disabled>Select blueprint...</option>{templates.map(tpl => (<option key={tpl.id} value={tpl.id}>{tpl.name}</option>))}</select>
                    </div>
                  )}

                  {canEdit && (selectedFile || document) && (
                    <div className={`p-6 rounded-[2rem] border transition-all ${suggestions ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                      {suggestions ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center text-xl"><i className="fas fa-sparkles"></i></div><h4 className="text-lg font-black">AI Recommendations Ready</h4></div><button onClick={() => setSuggestions(null)} className="text-white/60 hover:text-white"><i className="fas fa-times"></i></button></div>
                          <div className="grid grid-cols-2 gap-4 text-white/90"><div className="bg-white/10 p-4 rounded-xl"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Classification</p><p className="font-bold">{suggestions.suggestedClassification}</p></div><div className="bg-white/10 p-4 rounded-xl"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Summary</p><p className="text-xs">{suggestions.summary}</p></div></div>
                          <div className="pt-2 flex gap-3"><button onClick={applySuggestions} className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-black text-xs uppercase hover:bg-indigo-50 transition-all">Apply Insight</button></div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl flex-shrink-0"><i className="fas fa-magic"></i></div>
                          <div className="flex-1"><h4 className="text-lg font-black">DocuVault AI Ingestion</h4><p className="text-xs opacity-80">Automatically analyze content for metadata generation.</p></div>
                          <button onClick={handleAIAnalyze} disabled={analyzing || (!formData.name && !selectedFile)} className="px-8 py-4 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all">{analyzing ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-bolt mr-2"></i>}Run Analysis</button>
                        </div>
                      )}
                    </div>
                  )}

                  {!document && !selectedFile && canEdit && (
                    <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200">
                      <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} />
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl text-blue-600 mx-auto mb-6"><i className="fas fa-cloud-upload-alt"></i></div>
                      <h4 className="text-lg font-black text-slate-800">Select Document for Ingestion</h4>
                      <p className="text-sm text-slate-400">Click to browse local files for secure upload.</p>
                    </div>
                  )}

                  {(document || selectedFile) && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Name</label><input type="text" disabled={!canEdit} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer</label><input type="text" disabled={!canEdit} value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classification</label><select disabled={!canEdit} value={formData.classification} onChange={(e) => setFormData({...formData, classification: e.target.value as Classification})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900">{Object.values(Classification).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Date</label><input type="date" disabled={!canEdit} value={formData.expirationDate} onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900" /></div>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label><textarea disabled={!canEdit} rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-900 resize-none"></textarea></div>
                      
                      {/* Approved By/On Fields */}
                      {isManagerOrAdmin && !isDraft && !isNeedsRevision && document && (
                        <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Approved By</label>
                             <input type="text" readOnly value={reviewerName} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-black text-slate-900 cursor-default" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Approved On</label>
                             <input type="text" readOnly value={reviewDate} className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-black text-slate-900 cursor-default" />
                           </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isManagerOrAdmin && isPendingReview && (
                    <div className="mt-8 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg"><i className="fas fa-gavel"></i></div>
                        <div><h4 className="text-lg font-black text-amber-900">Workflow Review Action</h4>{isUploader ? <p className="text-xs text-rose-600 font-bold">Conflicted: Uploader cannot perform review actions.</p> : <p className="text-xs text-amber-700">Audit content and determine lifecycle transition.</p>}</div>
                      </div>
                      {!isUploader && (
                        <>
                          <textarea rows={2} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl outline-none font-black text-slate-900 resize-none" placeholder="Provide audit reasoning..."></textarea>
                          <div className="flex gap-3"><button onClick={() => onReviewAction(document!.id, 'APPROVE', 'Verified by Manager')} className="px-6 py-3 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl">Approve</button><button disabled={!reviewComment} onClick={() => onReviewAction(document!.id, 'REQUEST_REVISION', reviewComment)} className="px-6 py-3 bg-purple-600 text-white text-xs font-black uppercase rounded-xl disabled:opacity-50">Revision Required</button><button disabled={!reviewComment} onClick={() => onReviewAction(document!.id, 'REJECT', reviewComment)} className="px-6 py-3 bg-rose-600 text-white text-xs font-black uppercase rounded-xl disabled:opacity-50">Reject</button></div>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-8">
                  {document?.versions.map((ver, idx) => (
                    <div key={idx} className="flex gap-6 items-center bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-blue-200 transition-all">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black border border-slate-100 text-slate-400 group-hover:text-blue-600">V{ver.version}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800">{ver.userName}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(ver.timestamp).toLocaleString()}</p>
                        {ver.comment && <p className="mt-2 text-[11px] text-slate-900 font-bold italic">"{ver.comment}"</p>}
                      </div>
                      {canEdit && <button onClick={() => onRevert(document!.id, ver)} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl">Restore</button>}
                    </div>
                  ))}
                  {document?.versions.length === 0 && <p className="text-center py-20 text-slate-400 font-bold">Initial deployment state. No previous versions recorded.</p>}
                </div>
              )}
            </div>

            <div className="px-8 py-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <div className="flex gap-4">
                {isDraft && isUploader && onDelete && <button onClick={() => onDelete(document!.id)} className="px-6 py-4 text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-2xl"><i className="fas fa-trash-alt mr-2"></i>Discard Draft</button>}
                <button onClick={onClose} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">Close</button>
              </div>
              <div className="flex gap-4">
                {activeTab === 'details' && canEdit && (selectedFile || document) && (
                  <>
                    <button onClick={() => onSave(formData)} className={`px-10 py-4 ${isDraft ? 'bg-white border border-slate-200 text-slate-700' : 'bg-slate-900 text-white'} text-xs font-black uppercase tracking-widest rounded-2xl`}>{document ? (isDraft ? 'Save Draft Progress' : 'Publish Revision') : 'Initialize Draft'}</button>
                    {isDraft && isUploader && onSubmitReview && <button onClick={() => onSubmitReview(document!.id)} className="px-10 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-200">Submit for InReview</button>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentModal;
