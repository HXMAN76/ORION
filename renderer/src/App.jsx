import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import Settings from './components/Settings';

function App() {
  const [view, setView] = useState('chat'); // chat, upload, settings
  const [collections, setCollections] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/health');
        if (response.ok) {
          setBackendStatus('connected');
          fetchData();
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        setBackendStatus('error');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch collections
      const collRes = await fetch('http://127.0.0.1:8000/api/collections');
      if (collRes.ok) {
        const data = await collRes.json();
        setCollections(data);
      }

      // Fetch documents
      const docRes = await fetch('http://127.0.0.1:8000/api/documents');
      if (docRes.ok) {
        const data = await docRes.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleUploadComplete = () => {
    fetchData();
    setView('chat');
  };

  return (
    <div className="app">
      <Sidebar
        collections={collections}
        documents={documents}
        selectedCollection={selectedCollection}
        onSelectCollection={setSelectedCollection}
        view={view}
        onViewChange={setView}
        backendStatus={backendStatus}
      />

      <main className="main-content">
        {view === 'chat' && (
          <ChatInterface
            selectedCollection={selectedCollection}
          />
        )}

        {view === 'upload' && (
          <FileUpload
            collections={collections}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {view === 'settings' && (
          <Settings />
        )}
      </main>
    </div>
  );
}

export default App;
