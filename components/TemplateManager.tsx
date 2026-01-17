
import React, { useState } from 'react';
import { DocumentTemplate, Classification, UserRole } from '../types';

interface TemplateManagerProps {
  templates: DocumentTemplate[];
  onSave: (template: DocumentTemplate) => void;
  onDelete: (id: string) => void;
  currentUserRole: UserRole;
  currentUserId: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onSave, onDelete, currentUserRole, currentUserId }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    defaultClassification: Classification.INTERNAL,
    defaultTags: [],
    defaultDescription: ''
  });

  const handleSave = () => {
    if (!formData.name) return;
    const newTemplate: DocumentTemplate = {
      id: formData.id || `tpl-${Date.now()}`,
      name: formData.name,
      description: formData.description || '',
      defaultClassification: formData.defaultClassification || Classification.INTERNAL,
      defaultTags: formData.defaultTags || [],
      defaultDescription: formData.defaultDescription || '',
      createdBy: currentUserId,
      createdAt: new Date().toISOString()
    };
    onSave(newTemplate);
    setIsAdding(false);
    setFormData({
      name: '',
      description: '',
      defaultClassification: Classification.INTERNAL,
      defaultTags: [],
      defaultDescription: ''
    });
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Document Blueprints</h2>
          <p className="text-sm text-slate-500">Standardize metadata structures for different document categories.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Define Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <i className="fas fa-scroll"></i>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setFormData(tpl); setIsAdding(true); }} className="text-slate-300 hover:text-blue-600 p-1"><i className="fas fa-edit"></i></button>
                <button onClick={() => onDelete(tpl.id)} className="text-slate-300 hover:text-red-600 p-1"><i className="fas fa-trash"></i></button>
              </div>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 mb-1">{tpl.name}</h3>
            <p className="text-xs text-slate-400 font-medium mb-4 flex-1">{tpl.description}</p>
            
            <div className="space-y-3 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Default Security</span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${getClassificationColor(tpl.defaultClassification)}`}>
                  {tpl.defaultClassification}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tags</span>
                <div className="flex gap-1">
                  {tpl.defaultTags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">#{tag}</span>
                  ))}
                  {tpl.defaultTags.length > 2 && <span className="text-[8px] text-slate-300">+{tpl.defaultTags.length - 2}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-slate-300">
            <i className="fas fa-layer-group text-4xl mb-4"></i>
            <p className="font-bold text-slate-400">No blueprints established yet.</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">{formData.id ? 'Refine Blueprint' : 'Define New Blueprint'}</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Template Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  placeholder="e.g., Financial Audit"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Blueprint Scope</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm resize-none"
                  rows={2}
                  placeholder="What is this blueprint used for?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Security</label>
                  <select 
                    value={formData.defaultClassification}
                    onChange={e => setFormData({...formData, defaultClassification: e.target.value as Classification})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {Object.values(Classification).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Tags</label>
                  <input 
                    type="text"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setFormData(prev => ({ ...prev, defaultTags: [...(prev.defaultTags || []), val] }));
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    placeholder="Type & press Enter"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.defaultTags?.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">#{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default Content Narrative</label>
                <textarea 
                  value={formData.defaultDescription}
                  onChange={e => setFormData({...formData, defaultDescription: e.target.value})}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm resize-none"
                  rows={2}
                  placeholder="Pre-defined description block..."
                />
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Cancel</button>
              <button 
                onClick={handleSave}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200"
              >
                Establish Blueprint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
