
import React from 'react';

interface FileViewerProps {
  url?: string;
  name: string;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ url, name, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col">
      <div className="h-16 px-8 bg-slate-900/50 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <i className="fas fa-eye"></i>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{name}</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Secure In-Browser Inspection</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-1.5 bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase rounded-full border border-rose-500/30">
            Download Disabled
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <div className="w-full max-w-5xl h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative group">
          {url ? (
            <div className="w-full h-full relative">
              {/* Overlay to prevent some right-click interactions */}
              <div className="absolute inset-0 z-10 pointer-events-none select-none"></div>
              <iframe 
                src={`${url}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full border-none"
                title="Document Content"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-6">
              <i className="fas fa-file-circle-exclamation text-8xl opacity-20"></i>
              <div className="text-center max-w-xs">
                <p className="font-bold text-slate-800">Content Stream Unavailable</p>
                <p className="text-sm mt-2">Only metadata is currently available for this asset type in the secure viewer.</p>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900/80 backdrop-blur text-white rounded-full text-xs font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fas fa-shield-check text-emerald-400 mr-2"></i>
            Encrypted Document View • Restricted Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
