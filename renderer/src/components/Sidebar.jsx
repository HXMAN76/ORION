import React from 'react';
import { MessageSquare, Upload, Settings, Folder, FileText, Image, Mic } from 'lucide-react';

function Sidebar({
  collections,
  documents,
  selectedCollection,
  onSelectCollection,
  view,
  onViewChange,
  backendStatus
}) {
  const docTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'docx':
        return <FileText size={16} />;
      case 'image':
        return <Image size={16} />;
      case 'voice':
        return <Mic size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span style={{ fontSize: '18px' }}>◉</span>
          </div>
          <span>ORION</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-button ${view === 'chat' ? 'active' : ''}`}
          onClick={() => onViewChange('chat')}
        >
          <MessageSquare size={18} />
          Chat
        </button>
        <button
          className={`nav-button ${view === 'upload' ? 'active' : ''}`}
          onClick={() => onViewChange('upload')}
        >
          <Upload size={18} />
          Upload Files
        </button>
        <button
          className={`nav-button ${view === 'settings' ? 'active' : ''}`}
          onClick={() => onViewChange('settings')}
        >
          <Settings size={18} />
          Settings
        </button>
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Collections</div>
        <div
          className={`collection-item ${selectedCollection === null ? 'active' : ''}`}
          onClick={() => onSelectCollection(null)}
        >
          <Folder size={16} />
          All Documents
        </div>
        {collections.map((collection) => (
          <div
            key={collection}
            className={`collection-item ${selectedCollection === collection ? 'active' : ''}`}
            onClick={() => onSelectCollection(collection)}
          >
            <Folder size={16} />
            {collection}
          </div>
        ))}

        {documents.length > 0 && (
          <>
            <div className="sidebar-section-title" style={{ marginTop: '24px' }}>
              Recent Documents
            </div>
            {documents.slice(0, 10).map((doc) => (
              <div key={doc.document_id} className="collection-item">
                {docTypeIcon(doc.doc_type)}
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {doc.source_file.split('/').pop()}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className={`status-dot ${backendStatus}`}></div>
          <span>
            {backendStatus === 'connected' ? 'Backend Connected' :
              backendStatus === 'checking' ? 'Connecting...' :
                'Backend Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
