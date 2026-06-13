import React, { useMemo, useState } from 'react';

// Define agent coordinates in SVG space (800x360)
const AGENTS_METADATA = {
  "CEO Agent": { x: 400, y: 50, color: '#a78bfa', icon: '👑', short: 'CEO' },
  "Market Research Agent": { x: 120, y: 150, color: '#38bdf8', icon: '📊', short: 'Market' },
  "Competitor Agent": { x: 310, y: 150, color: '#2dd4bf', icon: '🔍', short: 'Competitor' },
  "Product Manager Agent": { x: 490, y: 150, color: '#fb7185', icon: '📦', short: 'Product' },
  "UI/UX Agent": { x: 680, y: 150, color: '#f472b6', icon: '🎨', short: 'UI/UX' },
  "Marketing Agent": { x: 220, y: 280, color: '#fb923c', icon: '📢', short: 'Marketing' },
  "Finance Agent": { x: 400, y: 280, color: '#34d399', icon: '💵', short: 'Finance' },
  "Legal Agent": { x: 580, y: 280, color: '#f59e0b', icon: '⚖️', short: 'Legal' }
};

const AGENT_KEYS = {
  "CEO Agent": "ceo",
  "Market Research Agent": "market",
  "Competitor Agent": "competitor",
  "Product Manager Agent": "product",
  "UI/UX Agent": "design",
  "Marketing Agent": "marketing",
  "Finance Agent": "finance",
  "Legal Agent": "legal"
};

// Define links to draw lines
const NETWORK_LINKS = [
  { from: "CEO Agent", to: "Market Research Agent" },
  { from: "CEO Agent", to: "Competitor Agent" },
  { from: "CEO Agent", to: "Product Manager Agent" },
  { from: "CEO Agent", to: "UI/UX Agent" },
  { from: "CEO Agent", to: "Marketing Agent" },
  { from: "CEO Agent", to: "Finance Agent" },
  { from: "CEO Agent", to: "Legal Agent" },
  { from: "Market Research Agent", to: "Competitor Agent" },
  { from: "Competitor Agent", to: "Product Manager Agent" },
  { from: "Product Manager Agent", to: "UI/UX Agent" },
  { from: "Product Manager Agent", to: "Finance Agent" },
  { from: "Finance Agent", to: "Legal Agent" },
  { from: "Marketing Agent", to: "UI/UX Agent" }
];

export default function AgentGraph({ activeMessage, onAgentClick }) {

  const [hoveredAgent, setHoveredAgent] = useState(null);

  // Determine who is sending and receiving
  const { sender, recipient, status } = activeMessage || {};

  const isTransmitting = sender && recipient && AGENTS_METADATA[sender] && AGENTS_METADATA[recipient];

  // Calculate pulse coordinate path
  const pulsePath = useMemo(() => {
    if (!isTransmitting) return null;
    const start = AGENTS_METADATA[sender];
    const end = AGENTS_METADATA[recipient];
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }, [isTransmitting, sender, recipient]);

  return (
    <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: sender ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: sender ? '0 0 10px var(--primary)' : 'none',
            animation: sender ? 'pulse 1.5s infinite' : 'none'
          }}></div>
          <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Orchestration Hub</h3>
        </div>
        {sender && (
          <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600', textTransform: 'uppercase' }}>
            {status === 'critique' ? '⚠️ Critique Round' : status === 'refining' ? '🔄 Refining' : '⚡ Active Transmission'}
          </span>
        )}
      </div>

      <div style={{ width: '100%', position: 'relative' }}>
        <svg viewBox="0 0 800 340" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            {/* Glow Filter for lasers */}
            <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Linear gradients for colored lasers */}
            {isTransmitting && (
              <linearGradient id="laser-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={AGENTS_METADATA[sender].color} />
                <stop offset="100%" stopColor={AGENTS_METADATA[recipient].color} />
              </linearGradient>
            )}
          </defs>

          {/* Network Link Lines */}
          {NETWORK_LINKS.map((link, idx) => {
            const start = AGENTS_METADATA[link.from];
            const end = AGENTS_METADATA[link.to];
            const isActive = isTransmitting && 
              ((sender === link.from && recipient === link.to) || 
               (sender === link.to && recipient === link.from));

            return (
              <line
                key={idx}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={isActive ? 'url(#laser-gradient)' : 'rgba(255, 255, 255, 0.05)'}
                strokeWidth={isActive ? 3 : 1.5}
                strokeDasharray={isActive ? 'none' : '4 4'}
                filter={isActive ? 'url(#laser-glow)' : 'none'}
                style={{ transition: 'all 0.5s ease' }}
              />
            );
          })}

          {/* Moving Laser Pulse Ball */}
          {isTransmitting && pulsePath && (
            <circle r="6" fill="#ffffff" filter="url(#laser-glow)">
              <animateMotion
                dur="1.2s"
                repeatCount="indefinite"
                path={pulsePath}
              />
            </circle>
          )}

          {/* Agent Nodes */}
          {Object.entries(AGENTS_METADATA).map(([agentName, meta]) => {
            const isSelfThinking = sender === agentName;
            const isSelfRecipient = recipient === agentName;
            const isHovered = hoveredAgent === agentName;
            
            let strokeColor = 'rgba(255, 255, 255, 0.1)';
            let nodeShadow = 'none';
            let strokeWidth = 1.5;
            
            if (isSelfThinking) {
              strokeColor = meta.color;
              nodeShadow = `0 0 18px ${meta.color}`;
              strokeWidth = 2.5;
            } else if (isSelfRecipient) {
              strokeColor = '#ffffff';
              nodeShadow = '0 0 12px rgba(255,255,255,0.4)';
              strokeWidth = 2;
            }

            return (
              <g 
                key={agentName} 
                transform={`translate(${meta.x}, ${meta.y})`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredAgent(agentName)}
                onMouseLeave={() => setHoveredAgent(null)}
                onClick={() => onAgentClick && onAgentClick(AGENT_KEYS[agentName], agentName)}
              >
                {/* Outer Glowing Ring */}
                <circle
                  r={isHovered ? 32 : 28}
                  fill="rgba(13, 20, 38, 0.95)"
                  stroke={isHovered ? meta.color : strokeColor}
                  strokeWidth={isHovered ? 3 : strokeWidth}
                  style={{
                    filter: isSelfThinking || isSelfRecipient || isHovered 
                      ? 'drop-shadow(' + (isHovered ? `0 0 15px ${meta.color}` : nodeShadow) + ')' 
                      : 'none',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: isSelfThinking ? 'pulse 2s infinite' : 'none'
                  }}
                />

                {/* Avatar Icon */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isHovered ? "22" : "20"}
                  y="-1"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  {meta.icon}
                </text>

                {/* Label Block */}
                <g transform="translate(0, 42)">
                  {/* Backdrop rectangle for legibility */}
                  <rect
                    x="-45"
                    y="-10"
                    width="90"
                    height="18"
                    rx="4"
                    fill="rgba(7, 11, 22, 0.85)"
                    stroke={isHovered ? meta.color : "rgba(255, 255, 255, 0.05)"}
                    strokeWidth="1"
                    style={{ transition: 'stroke 0.2s ease' }}
                  />
                  <text
                    textAnchor="middle"
                    fill={isSelfThinking || isHovered ? meta.color : 'var(--text-muted)'}
                    fontSize="10"
                    fontWeight={isSelfThinking || isHovered ? '800' : '600'}
                    style={{ transition: 'fill 0.2s ease' }}
                  >
                    {isHovered ? '⚙️ Edit Config' : meta.short}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>

  );
}
