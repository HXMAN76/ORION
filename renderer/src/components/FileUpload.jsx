import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, Mic, X, Check, Loader2 } from 'lucide-react';

function FileUpload({ collections, onUploadComplete }) {
  const [files, setFiles] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [newCollection, setNewCollection] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf', 'docx', 'doc'].includes(ext)) return <FileText size={20} />;
    if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext)) return <Image size={20} />;
    if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return <Mic size={20} />;
    return <FileText size={20} />;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const fileItems = newFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      status: 'pending', // pending, uploading, success, error
      progress: 0
    }));
    setFiles(prev => [...prev, ...fileItems]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];

      // Update status to uploading
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        const formData = new FormData();
        formData.append('file', fileItem.file);

        const allCollections = [...selectedCollections];
        if (newCollection.trim()) {
          allCollections.push(newCollection.trim());
        }
        if (allCollections.length > 0) {
          formData.append('collections', allCollections.join(','));
        }

        const response = await fetch('http://127.0.0.1:8000/api/ingest', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          setFiles(prev => prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success', progress: 100 } : f
          ));
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: error.message } : f
        ));
      }
    }

    setIsUploading(false);

    // Callback after all uploads
    setTimeout(() => {
      if (onUploadComplete) onUploadComplete();
    }, 1500);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleCollection = (collection) => {
    setSelectedCollections(prev =>
      prev.includes(collection)
        ? prev.filter(c => c !== collection)
        : [...prev, collection]
    );
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Documents</h1>
        <p>Drag and drop files or click to browse. Supports PDF, DOCX, images, and audio files.</p>
      </div>

      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="upload-icon" size={64} />
        <div className="upload-text">Drop files here or click to upload</div>
        <div className="upload-hint">
          PDF, DOCX, PNG, JPG, MP3, WAV and more
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.bmp,.mp3,.wav,.m4a,.ogg,.flac"
        />
      </div>

      {files.length > 0 && (
        <div className="upload-files">
          <div style={{ marginBottom: '16px' }}>
            <div className="sidebar-section-title">Add to Collections</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {collections.map(collection => (
                <button
                  key={collection}
                  className={`btn ${selectedCollections.includes(collection) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleCollection(collection)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {collection}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or create new collection..."
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
              className="chat-input"
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                padding: '10px 16px',
                width: '300px'
              }}
            />
          </div>

          {files.map((fileItem, index) => (
            <div key={index} className="upload-file-item">
              <div className="upload-file-icon">
                {getFileIcon(fileItem.name)}
              </div>
              <div className="upload-file-info">
                <div className="upload-file-name">{fileItem.name}</div>
                <div className="upload-file-status">
                  {fileItem.status === 'pending' && formatFileSize(fileItem.size)}
                  {fileItem.status === 'uploading' && 'Uploading...'}
                  {fileItem.status === 'success' && '✓ Uploaded successfully'}
                  {fileItem.status === 'error' && '✗ Upload failed'}
                </div>
                {fileItem.status === 'uploading' && (
                  <div className="upload-progress">
                    <div className="upload-progress-bar" style={{ width: '50%' }}></div>
                  </div>
                )}
              </div>
              {fileItem.status === 'pending' && (
                <button
                  onClick={() => removeFile(index)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              )}
              {fileItem.status === 'success' && (
                <Check size={18} style={{ color: 'var(--success)' }} />
              )}
              {fileItem.status === 'uploading' && (
                <Loader2 size={18} className="loading-spinner" />
              )}
            </div>
          ))}

          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={isUploading || files.every(f => f.status !== 'pending')}
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="loading-spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Upload {files.filter(f => f.status === 'pending').length} Files
                </>
              )}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setFiles([])}
              disabled={isUploading}
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
