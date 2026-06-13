import React, { useState, useEffect, useRef } from 'react';
import Settings from './components/Settings';
import AgentGraph from './components/AgentGraph';
import CEOConsole from './components/CEOConsole';
import OutputViewer from './components/OutputViewer';

const BACKEND_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeMessage, setActiveMessage] = useState(null);
  const [newIdea, setNewIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Agent customization / retraining states
  const [defaultPrompts, setDefaultPrompts] = useState({});
  const [selectedAgentKey, setSelectedAgentKey] = useState('');
  const [selectedAgentName, setSelectedAgentName] = useState('');
  const [editingPrompt, setEditingPrompt] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [clickedAgent, setClickedAgent] = useState(null);

  const [showConsole, setShowConsole] = useState(true);
  const [spawnSelectedAgents, setSpawnSelectedAgents] = useState({
    market: true,
    competitor: true,
    product: true,
    design: true,
    marketing: true,
    finance: true,
    legal: true
  });


  // Settings state cached in local storage
  const [settings, setSettings] = useState(() => {
    const cached = localStorage.getItem('ai_ceo_settings');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.useSimulation === undefined) parsed.useSimulation = false;
        if (!parsed.apiKey) parsed.apiKey = '';
        if (parsed.modelName === 'gemini-1.5-flash' || !parsed.modelName) parsed.modelName = 'gemini-2.0-flash';
        if (parsed.modelName === 'gemini-1.5-pro') parsed.modelName = 'gemini-2.5-pro';
        return parsed;
      } catch (e) {}
    }
    return {
      apiKey: '',
      mongoUri: 'mongodb://localhost:27017',
      modelName: 'gemini-2.0-flash',
      useSimulation: false
    };
  });

  const socketRef = useRef(null);

  // Cache settings
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('ai_ceo_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  // Fetch projects list
  const fetchProjects = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error('Failed to load projects list:', e);
    }
  };

  const fetchDefaultPrompts = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/agent-defaults`);
      if (res.ok) {
        const data = await res.json();
        setDefaultPrompts(data);
      }
    } catch (e) {
      console.error('Failed to load default agent prompts:', e);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchDefaultPrompts();
  }, []);


  // Fetch individual project and its messages
  const loadProjectDetails = async (projectId) => {
    try {
      const projRes = await fetch(`${BACKEND_URL}/projects/${projectId}`);
      if (projRes.ok) {
        const projData = await projRes.json();
        setActiveProject(projData);
        
        // Fetch historical messages
        const msgRes = await fetch(`${BACKEND_URL}/projects/${projectId}/messages`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData);
          if (msgData.length > 0) {
            setActiveMessage(msgData[msgData.length - 1]);
          }
        }
      }
    } catch (e) {
      console.error('Error loading project details:', e);
    }
  };

  // Handle switching projects
  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    // Disconnect existing socket if open
    if (socketRef.current) {
      socketRef.current.close();
    }
    loadProjectDetails(projectId);
    connectWebSocket(projectId);
  };

  // Connect websocket for live updates
  const connectWebSocket = (projectId) => {
    const ws = new WebSocket(`${WS_URL}/ws/projects/${projectId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`WebSocket channel established for project: ${projectId}`);
    };

    ws.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet.type === 'agent_message') {
          const newMsg = packet.data;
          setMessages(prev => {
            // Avoid duplicate message inserts
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setActiveMessage(newMsg);
        } else if (packet.type === 'project_updated') {
          setActiveProject(packet.data);
          // Refresh project list on sidebar to update status/names
          fetchProjects();
        }
      } catch (err) {
        console.error('Error reading WS message packet:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };

    ws.onclose = () => {
      console.log(`WebSocket closed for project: ${projectId}`);
    };
  };

  // Clean socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  // Launch New Startup Plan
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newIdea.trim()) return;

    setGenerating(true);
    setMessages([]);
    setActiveMessage(null);
    setActiveProject(null);

    try {
      const response = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: newIdea,
          api_key: settings.useSimulation ? null : settings.apiKey,
          model_name: settings.modelName,
          selected_agents: Object.keys(spawnSelectedAgents).filter(k => spawnSelectedAgents[k])
        })
      });

      if (response.ok) {
        const resData = await response.json();
        const newProjId = resData.project_id;
        setSelectedProjectId(newProjId);
        
        // Wait briefly for server file allocation, then fetch details & connect socket
        setTimeout(async () => {
          await loadProjectDetails(newProjId);
          connectWebSocket(newProjId);
          await fetchProjects();
          setNewIdea('');
          setGenerating(false);
        }, 500);
      } else {
        const err = await response.json();
        alert(`Failed to launch workspace: ${err.detail || 'Server error'}`);
        setGenerating(false);
      }
    } catch (err) {
      alert(`Connection failed: Can't reach FastAPI server on ${BACKEND_URL}`);
      setGenerating(false);
    }
  };

  // Submit refinement loop feedback
  const handleTriggerRefine = async (feedbackText, selectedAgents) => {
    if (!activeProject) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/projects/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: activeProject.id,
          feedback: feedbackText,
          selected_agents: selectedAgents,
          api_key: settings.useSimulation ? null : settings.apiKey
        })
      });
      
      if (!response.ok) {
        alert('Failed to submit refinement directive.');
      }
    } catch (e) {
      console.error('Refine call error:', e);
    }
  };

  const handleAgentClick = (agentKey, agentName) => {
    if (!activeProject) {
      alert("Please select or spawn a startup project workspace before customizing agent system prompts.");
      return;
    }
    setSelectedAgentKey(agentKey);
    setSelectedAgentName(agentName);
    
    const customConfigs = activeProject.agent_configs || {};
    const existingPrompt = customConfigs[agentKey] || defaultPrompts[agentKey] || "";
    setEditingPrompt(existingPrompt);
    setShowDrawer(true);
    setClickedAgent({ key: agentKey, time: Date.now() });
  };

  const handleSaveAgentConfig = async () => {
    if (!activeProject || !selectedAgentKey) return;
    setSavingPrompt(true);
    try {
      const response = await fetch(`${BACKEND_URL}/projects/${activeProject.id}/agent-configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [selectedAgentKey]: editingPrompt })
      });
      if (response.ok) {
        const resData = await response.json();
        // Update local project details with updated agent configs
        setActiveProject(prev => ({
          ...prev,
          agent_configs: resData.agent_configs
        }));
        await fetchProjects();
        setShowDrawer(false);
      } else {
        alert("Failed to save agent configuration.");
      }
    } catch (err) {
      console.error("Error saving agent configuration:", err);
      alert("Connection error occurred while saving configuration.");
    } finally {
      setSavingPrompt(false);
    }
  };

  return (

    <div className="app-container">
      {/* Upper Navigation Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>🤖</span>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff' }}>
              AI CEO <span style={{ color: 'var(--primary)', fontWeight: '300' }}>— Company-in-a-Box</span>
            </h1>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Multi-Agent Startup Incubator
            </p>
          </div>
        </div>

        {activeProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace:</span>
            <strong style={{ fontSize: '13px', color: '#fff' }}>{activeProject.name}</strong>
            <span className={`badge ${
              activeProject.status === 'completed' ? 'badge-success' : 
              activeProject.status === 'generating' || activeProject.status === 'refining' ? 'badge-info' : 'badge-warning'
            } anim-pulse-blue`}>
              {activeProject.status}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: '#fff' }}>
            <input
              type="checkbox"
              checked={showConsole}
              onChange={(e) => setShowConsole(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <span>📟 Show Console Logs</span>
          </label>

          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* Main Layout Workspace Grid */}
      <div className="main-layout">
        
        {/* Left Sidebar */}
        <aside className="sidebar">
          
          {/* Section 1: Create Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Spawn New Startup
            </h3>
            <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Describe your startup idea (e.g. Build a startup around AI for farmers...)"
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                disabled={generating}
                style={{ resize: 'none', fontSize: '13px' }}
              />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>SELECT ACTIVE AGENTS:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  {[
                    { key: 'market', name: 'Market Research' },
                    { key: 'competitor', name: 'Competitor Analyst' },
                    { key: 'product', name: 'Product Manager' },
                    { key: 'design', name: 'UI/UX Guidelines' },
                    { key: 'finance', name: 'Finance Agent' },
                    { key: 'marketing', name: 'Marketing Specialist' },
                    { key: 'legal', name: 'Legal Compliance' }
                  ].map(agent => (
                    <label key={agent.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={spawnSelectedAgents[agent.key]}
                        onChange={(e) => setSpawnSelectedAgents(prev => ({ ...prev, [agent.key]: e.target.checked }))}
                        disabled={generating}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>{agent.name}</span>
                    </label>
                  ))}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setSpawnSelectedAgents({ market: true, competitor: true, product: true, design: true, marketing: true, finance: true, legal: true })}
                      style={{ fontSize: '10px', background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0 }}
                      disabled={generating}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpawnSelectedAgents({ market: false, competitor: false, product: false, design: false, marketing: false, finance: false, legal: false })}
                      style={{ fontSize: '10px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      disabled={generating}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={generating || !newIdea.trim()}
                style={{ width: '100%' }}
              >
                {generating ? 'Spawning...' : '🚀 Orchestrate CEO'}
              </button>
            </form>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          {/* Section 2: Previous Lists */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Active Blueprints
            </h3>
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              paddingRight: '4px' 
            }}>
              {projects.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-dark)', padding: '20px 0', textAlign: 'center' }}>
                  No startups generated yet.
                </div>
              ) : (
                projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProjectSelect(p.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: selectedProjectId === p.id ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid ' + (selectedProjectId === p.id ? 'var(--primary)' : 'var(--border)'),
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {p.name}
                      </strong>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', color: p.status === 'completed' ? 'var(--primary)' : 'var(--secondary)' }}>
                        {p.status}
                      </span>
                    </div>
                    <p style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-muted)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis' 
                    }}>
                      {p.idea}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

        </aside>

        {/* Center Workspace Area */}
        <main className="workspace">
          {!selectedProjectId ? (
            /* Onboarding Panel */
            <div className="glass-panel" style={{
              flex: 1,
              padding: '60px 40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '24px'
            }}>
              <div style={{ fontSize: '54px', animation: 'pulse-blue 3s infinite' }}>🤖👔</div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
                  Welcome to AI CEO Control Room
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.6' }}>
                  Input a startup idea and click <strong>Orchestrate CEO</strong>. The AI CEO will dynamically partition the task and deploy 7 autonomous agents to research, design, finance, and package your company-in-a-box.
                </p>
              </div>

              {/* Agent Grid Legend */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                width: '100%',
                maxWidth: '680px',
                marginTop: '12px'
              }}>
                {[
                  { icon: '📊', name: 'Market Research', role: 'TAM/SAM/SOM' },
                  { icon: '🔍', name: 'Competitor Agent', role: 'SWOT & Advantage' },
                  { icon: '📦', name: 'Product Manager', role: 'MVP roadmaps' },
                  { icon: '🎨', name: 'UI/UX Developer', role: 'HTML Sandbox' },
                  { icon: '💵', name: 'Finance Agent', role: 'Pricing & MRR' },
                  { icon: '📢', name: 'Marketing Specialist', role: 'GTM timeline' },
                  { icon: '⚖️', name: 'Legal Compliance', role: 'Risk audit' }
                ].map(agent => (
                  <div key={agent.name} style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--border)',
                    padding: '12px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{agent.icon}</div>
                    <strong style={{ fontSize: '11px', display: 'block', color: '#fff' }}>{agent.name}</strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{agent.role}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Selected Workspace Dashboard */
            <>
              {/* Row 1: Agent Communication Network */}
              <AgentGraph activeMessage={activeMessage} onAgentClick={handleAgentClick} />
              
              {/* Row 2: Deliverables Output Viewer */}
              <OutputViewer 
                project={activeProject} 
                onTriggerRefine={handleTriggerRefine} 
                refining={activeProject?.status === 'refining'} 
                clickedAgent={clickedAgent}
              />
              
              {/* Row 3: Command Console Logs */}
              {showConsole && <CEOConsole messages={messages} />}
            </>
          )}
        </main>

      </div>

      {/* Settings Modal Dialog Overlay */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
            <button 
              onClick={() => setShowSettings(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <Settings settings={settings} onSaveSettings={handleSaveSettings} />
          </div>
        </div>
      )}

      {/* Sliding Drawer for Agent Configuration / Retraining */}
      {showDrawer && <div className="drawer-overlay active" onClick={() => setShowDrawer(false)} />}
      <div className={`drawer ${showDrawer ? 'open' : ''}`}>
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>
              {selectedAgentKey === 'ceo' ? '👑' :
               selectedAgentKey === 'market' ? '📊' :
               selectedAgentKey === 'competitor' ? '🔍' :
               selectedAgentKey === 'product' ? '📦' :
               selectedAgentKey === 'design' ? '🎨' :
               selectedAgentKey === 'marketing' ? '📢' :
               selectedAgentKey === 'finance' ? '💵' : '⚖️'}
            </span>
            <div>
              <h2 style={{ fontSize: '16px', color: '#fff' }}>{selectedAgentName}</h2>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                System Prompt Customizer
              </p>
            </div>
          </div>
          <button className="drawer-close" onClick={() => setShowDrawer(false)}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '10px' }}>
              Role: {
                selectedAgentKey === 'ceo' ? 'Executive Coordinator' :
                selectedAgentKey === 'market' ? 'Market Research' :
                selectedAgentKey === 'competitor' ? 'Competitor Analyst' :
                selectedAgentKey === 'product' ? 'Product Manager' :
                selectedAgentKey === 'design' ? 'UI/UX & Frontend' :
                selectedAgentKey === 'marketing' ? 'GTM Specialist' :
                selectedAgentKey === 'finance' ? 'Financial Planner' : 'Legal & Compliance'
              }
            </span>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Modify the agent's core instructions below to customize its logic, behavior, outputs, and personality. Click Save, then run generation or refinement loops to verify the custom training.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Agent Instructions (System Prompt)
            </label>
            <textarea
              className="input-field"
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                lineHeight: '1.6',
                resize: 'none',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border)',
                padding: '12px',
                color: '#10b981'
              }}
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              placeholder="Enter system prompt instructions..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1 }} 
            onClick={() => {
              if (window.confirm("Are you sure you want to reset this agent's prompt to system defaults?")) {
                setEditingPrompt(defaultPrompts[selectedAgentKey] || "");
              }
            }}
          >
            🔄 Reset Default
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            onClick={handleSaveAgentConfig}
            disabled={savingPrompt}
          >
            {savingPrompt ? 'Saving...' : '💾 Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
}
