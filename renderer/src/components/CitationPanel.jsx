import React from 'react';

function CitationPanel({ sources }) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const formatLocation = (source) => {
    const parts = [];
    if (source.page) parts.push(`Page ${source.page}`);
    if (source.timestamp) {
      const start = formatTime(source.timestamp.start);
      const end = source.timestamp.end ? formatTime(source.timestamp.end) : null;
      parts.push(end ? `${start} - ${end}` : `at ${start}`);
    }
    if (source.speaker) parts.push(`Speaker: ${source.speaker}`);
    return parts.join(', ');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'pdf': return '#ef4444';
      case 'docx': return '#3b82f6';
      case 'image': return '#22c55e';
      case 'voice': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="citation-panel">
      <div className="citation-header">
        <span className="citation-title">Sources ({sources.length})</span>
      </div>
      <div className="citation-list">
        {sources.map((source, index) => (
          <div key={index} className="citation-item">
            <div className="citation-index" style={{ background: getTypeColor(source.type) }}>
              {source.index}
            </div>
            <div className="citation-info">
              <div className="citation-file">{source.file}</div>
              {source.location && (
                <div className="citation-location">{source.location}</div>
              )}
              <div className="citation-meta">
                <span className="citation-type">{source.type.toUpperCase()}</span>
                <span className="citation-similarity">{source.similarity}% match</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CitationPanel;
