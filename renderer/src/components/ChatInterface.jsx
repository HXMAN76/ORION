import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

function ChatInterface({ selectedCollection }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          top_k: 5,
          collections: selectedCollection ? [selectedCollection] : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          confidence: data.confidence
        }]);
      } else {
        throw new Error('Query failed');
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure the backend is running and try again.',
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>
          {selectedCollection ? `Chat - ${selectedCollection}` : 'Chat with your documents'}
        </h1>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">Start a conversation</div>
            <div className="empty-state-description">
              Ask questions about your uploaded documents. The AI will find relevant information and provide answers with sources.
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            <div className="message-content">
              {message.content}

              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <div className="message-sources-title">Sources</div>
                  {message.sources.map((source, i) => (
                    <span key={i} className="source-chip">
                      [{source.index}] {source.file}
                      {source.location && ` (${source.location})`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message assistant">
            <div className="message-content" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="loading-spinner"></div>
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask a question about your documents..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? <Loader2 size={18} className="loading-spinner" /> : <Send size={18} />}
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInterface;
