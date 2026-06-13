import React, { useEffect, useRef, useState } from 'react';

const SENDER_COLORS = {
  "CEO Agent": "#c084fc",
  "Market Research Agent": "#38bdf8",
  "Competitor Agent": "#2dd4bf",
  "Product Manager Agent": "#fb7185",
  "UI/UX Agent": "#f472b6",
  "Marketing Agent": "#fb923c",
  "Finance Agent": "#34d399",
  "Legal Agent": "#fbbf24",
  "System": "#9ca3af"
};

export default function CEOConsole({ messages }) {
  const [filter, setFilter] = useState('all'); // all, critique, completed
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll disabled per user request to enable free scrolling during generation
  }, [messages]);

  const filteredMessages = messages.filter(msg => {
    if (filter === 'critique') return msg.status === 'critique';
    if (filter === 'completed') return msg.status === 'completed';
    return true;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toTimeString().split(' ')[0];
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '320px',
      overflow: 'hidden',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Header bar */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>&gt;_</span>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            CEO Console Output
          </span>
        </div>
        
        {/* Console Filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'critique', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: '1px solid ' + (filter === f ? 'var(--primary)' : 'var(--border)'),
                color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Screen */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        fontSize: '12px',
        lineHeight: '1.6',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'rgba(0,0,0,0.2)'
      }}>
        {filteredMessages.length === 0 ? (
          <div style={{ color: 'var(--text-dark)', textAlign: 'center', marginTop: '40px' }}>
            [SYSTEM IDLE - AWAITING STARTUP EXECUTION COMMAND]
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const senderColor = SENDER_COLORS[msg.sender] || '#ffffff';
            const showRecipient = msg.recipient && msg.recipient !== 'System' && msg.recipient !== 'Multi-Agent Pool';
            
            return (
              <div key={msg.id || index} style={{ borderLeft: `2px solid ${senderColor}`, paddingLeft: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                  {/* Timestamp */}
                  <span style={{ color: 'var(--text-dark)' }}>
                    [{formatTime(msg.timestamp)}]
                  </span>
                  
                  {/* Communication Flow */}
                  <span style={{ color: senderColor, fontWeight: 'bold' }}>
                    {msg.sender}
                  </span>
                  
                  {showRecipient && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
                      <span style={{ color: SENDER_COLORS[msg.recipient] || '#fff', fontWeight: 'bold' }}>
                        {msg.recipient}
                      </span>
                    </>
                  )}
                  
                  {/* Status Tag */}
                  <span style={{
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: msg.status === 'critique' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                    color: msg.status === 'critique' ? 'var(--danger)' : 'var(--text-muted)',
                    border: '1px solid ' + (msg.status === 'critique' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'),
                    textTransform: 'uppercase'
                  }}>
                    {msg.status}
                  </span>
                </div>
                
                {/* Message Content */}
                <div style={{ color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
