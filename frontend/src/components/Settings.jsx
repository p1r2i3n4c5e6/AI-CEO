import React, { useState } from 'react';

export default function Settings({ settings, onSaveSettings }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [mongoUri, setMongoUri] = useState(settings.mongoUri || 'mongodb://localhost:27017');
  const [modelName, setModelName] = useState(settings.modelName || 'gemini-2.0-flash');
  const [useSimulation, setUseSimulation] = useState(settings.useSimulation ?? false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiKey,
      mongoUri,
      modelName,
      useSimulation
    });
    alert('System Configuration Saved successfully!');
  };

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px' }}>⚙️</span>
        <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Control Console</h3>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Toggle Mode */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>DEMO SIMULATION MODE</span>
            <input 
              type="checkbox" 
              checked={useSimulation}
              onChange={(e) => setUseSimulation(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: 'var(--primary)'
              }}
            />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            When enabled, the workspace generates ultra-realistic startup plans with zero API consumption or setup delays.
          </p>
        </div>

        {/* API Key */}
        <div className="input-group">
          <label>Google Gemini API Key</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type={showKey ? 'text' : 'password'}
              className="input-field"
              style={{ flex: 1 }}
              placeholder={useSimulation ? "Not needed in simulation mode" : "AI-xxxxxx..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={useSimulation}
            />
            <button 
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0 12px' }}
              onClick={() => setShowKey(!showKey)}
              disabled={useSimulation}
            >
              {showKey ? '👁️' : '🕶️'}
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="input-group">
          <label>Orchestration LLM</label>
          <select 
            className="input-field"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            disabled={useSimulation}
            style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
          >
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Power Brain)</option>
          </select>
        </div>

        {/* MongoDB URI */}
        <div className="input-group">
          <label>MongoDB connection URI</label>
          <input 
            type="text"
            className="input-field"
            value={mongoUri}
            onChange={(e) => setMongoUri(e.target.value)}
            placeholder="mongodb://localhost:27017"
          />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '4px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--primary)',
              boxShadow: '0 0 8px var(--primary)'
            }}></div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Connected Mode (Auto-fallbacks to JSON files if database is offline)
            </span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
          Save Configuration
        </button>

      </form>
    </div>
  );
}
