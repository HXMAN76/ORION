import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';

function Settings() {
  const [stats, setStats] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const statsRes = await fetch('http://127.0.0.1:8000/api/stats');
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Check model status
      const modelRes = await fetch('http://127.0.0.1:8000/api/models/status');
      if (modelRes.ok) {
        setModelStatus(await modelRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">System Status</div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Total Documents</div>
            <div className="settings-item-description">Documents indexed in the system</div>
          </div>
          <div className="settings-item-value">
            {loading ? '...' : stats?.total_documents || 0}
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Total Chunks</div>
            <div className="settings-item-description">Text chunks in vector store</div>
          </div>
          <div className="settings-item-value">
            {loading ? '...' : stats?.total_chunks || 0}
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Collections</div>
            <div className="settings-item-description">Logical document groups</div>
          </div>
          <div className="settings-item-value">
            {loading ? '...' : stats?.total_collections || 0}
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Documents by Type</div>
            <div className="settings-item-description">Breakdown by file type</div>
          </div>
          <div className="settings-item-value" style={{ fontFamily: 'inherit' }}>
            {loading ? '...' : (
              Object.entries(stats?.documents_by_type || {}).map(([type, count]) => (
                <span key={type} style={{ marginLeft: '8px' }}>
                  {type}: {count}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Model Configuration</div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Language Model</div>
            <div className="settings-item-description">Local LLM for text generation</div>
          </div>
          <div className="settings-item-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {modelStatus?.llm?.model || 'mistral:7b'}
            {modelStatus?.llm?.available ? (
              <Check size={16} style={{ color: 'var(--success)' }} />
            ) : (
              <X size={16} style={{ color: 'var(--error)' }} />
            )}
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Embedding Model</div>
            <div className="settings-item-description">For semantic search</div>
          </div>
          <div className="settings-item-value">
            nomic-embed-text
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Vision Model</div>
            <div className="settings-item-description">For image understanding</div>
          </div>
          <div className="settings-item-value">
            llava
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Chunk Size</div>
            <div className="settings-item-description">Tokens per chunk</div>
          </div>
          <div className="settings-item-value">
            512
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">About</div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">ORION</div>
            <div className="settings-item-description">Offline Multimodal RAG System</div>
          </div>
          <div className="settings-item-value">
            v1.0.0
          </div>
        </div>

        <div className="settings-item">
          <div>
            <div className="settings-item-label">Vector Store</div>
            <div className="settings-item-description">Local persistence engine</div>
          </div>
          <div className="settings-item-value">
            ChromaDB
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'loading-spinner' : ''} />
          Refresh Status
        </button>
      </div>
    </div>
  );
}

export default Settings;
