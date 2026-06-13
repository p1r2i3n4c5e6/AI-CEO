import React, { useState, useEffect } from 'react';

export default function OutputViewer({ project, onTriggerRefine, refining, clickedAgent }) {
  const [activeTab, setActiveTab] = useState('common');

  // Financial Projections States
  const [monthlyVisitors, setMonthlyVisitors] = useState(5000);
  const [conversionRate, setConversionRate] = useState(2.5);
  const [churnRate, setChurnRate] = useState(5.0);
  const [premiumPrice, setPremiumPrice] = useState(29);
  const [enterprisePrice, setEnterprisePrice] = useState(199);

  // Refinement Directive States
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedAgents, setSelectedAgents] = useState([]);

  const artifacts = project?.artifacts || {};
  const {
    executive_summary,
    market_report,
    competitor_analysis,
    mvp_features,
    design_guidelines,
    pitch_deck,
    marketing_plan,
    revenue_model,
    legal_checklist
  } = artifacts;

  // Sync parameters with newly loaded project outputs
  useEffect(() => {
    if (revenue_model?.calculator_defaults) {
      const defaults = revenue_model.calculator_defaults;
      setMonthlyVisitors(defaults.monthly_visitors || 5000);
      setConversionRate(defaults.conversion_rate || 2.5);
      setChurnRate(defaults.churn_rate || 5.0);
    }
    if (revenue_model?.pricing) {
      const pricing = revenue_model.pricing;
      setPremiumPrice(pricing.premium_monthly_cost || 29);
      setEnterprisePrice(pricing.enterprise_monthly_cost || 199);
    }
  }, [revenue_model]);

  // Switch tab when clicked on Agent Graph node
  useEffect(() => {
    if (clickedAgent) {
      setActiveTab(clickedAgent.key);
    }
  }, [clickedAgent]);

  const handleAgentToggle = (agentKey) => {
    if (selectedAgents.includes(agentKey)) {
      setSelectedAgents(selectedAgents.filter(a => a !== agentKey));
    } else {
      setSelectedAgents([...selectedAgents, agentKey]);
    }
  };

  const handleRefineSubmit = () => {
    if (!feedbackText.trim() || selectedAgents.length === 0) return;
    onTriggerRefine(feedbackText, selectedAgents);
    setFeedbackText('');
  };

  // 12-month projections math
  const monthlyNewSignups = Math.round(monthlyVisitors * (conversionRate / 100));
  let premiumSubs = 0;
  let enterpriseSubs = 0;
  let revenueTimeline = [];
  for (let m = 1; m <= 12; m++) {
    premiumSubs = premiumSubs * (1 - churnRate / 100) + (monthlyNewSignups * 0.85);
    enterpriseSubs = enterpriseSubs * (1 - churnRate / 100) + (monthlyNewSignups * 0.15);
    const mrr = Math.round((premiumSubs * premiumPrice) + (enterpriseSubs * enterprisePrice));
    revenueTimeline.push({ month: m, mrr });
  }
  const finalMRR = revenueTimeline[11]?.mrr || 0;
  const finalARR = finalMRR * 12;

  if (!project || project.status === 'generating') {
    return (
      <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '4px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1.5s linear infinite' }} />
        <div>
          <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>CEO Agent Orchestrating Startup Blueprint...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '450px', margin: '0 auto' }}>
            Specialized agents are performing validation, scoping MVPs, outlining user experiences, building budgets, and checking regulatory protocols.
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'common', title: '📂 Combined Roadmap', icon: '📂' },
    { id: 'ceo', title: '👑 CEO coordinator', icon: '👑', requiredArtifact: 'pitch_deck' },
    { id: 'market', title: '📊 Market research', icon: '📊', requiredArtifact: 'market_report' },
    { id: 'competitor', title: '🔍 Competitor Analyst', icon: '🔍', requiredArtifact: 'competitor_analysis' },
    { id: 'product', title: '📦 Product Manager', icon: '📦', requiredArtifact: 'mvp_features' },
    { id: 'design', title: '🎨 UI/UX Designer', icon: '🎨', requiredArtifact: 'design_guidelines' },
    { id: 'marketing', title: '📢 Marketing Specialist', icon: '📢', requiredArtifact: 'marketing_plan' },
    { id: 'finance', title: '💵 Finance Planner', icon: '💵', requiredArtifact: 'revenue_model' },
    { id: 'legal', title: '⚖️ Legal & Compliance', icon: '⚖️', requiredArtifact: 'legal_checklist' }
  ];

  const currentTabObj = tabs.find(t => t.id === activeTab);
  const isArtifactMissing = currentTabObj?.requiredArtifact && !artifacts[currentTabObj.requiredArtifact];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      
      {/* Dashboard container */}
      <div className="glass-panel" style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        minHeight: '600px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        borderRadius: '12px'
      }}>
        
        {/* Navigation Sidebar */}
        <div style={{
          background: 'rgba(5, 8, 16, 0.4)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0'
        }}>
          <div style={{ padding: '0 20px 12px 20px', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              Incubator Modules
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, padding: '0 8px' }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const isMissing = tab.requiredArtifact && !artifacts[tab.requiredArtifact];
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    color: isActive ? 'var(--primary)' : isMissing ? 'var(--text-dark)' : 'var(--text-main)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: 'var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                    <span>{tab.title}</span>
                  </div>
                  {isMissing && (
                    <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-dark)', padding: '2px 5px', borderRadius: '4px' }}>
                      Inactive
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panel */}
        <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(9, 13, 24, 0.94)',
          overflowY: 'auto',
          maxHeight: '680px'
        }}>
          
          {isArtifactMissing ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '40px',
              gap: '16px'
            }}>
              <div style={{ fontSize: '48px' }}>📭</div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '8px' }}>Module Inactive</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                  This specialized agent was not selected in the startup config form. Toggle this agent in the refinement checklist at the bottom and enter feedback to run it.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Combined Startup Roadmap */}
              {activeTab === 'common' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  {/* Header Box */}
                  <div style={{
                    padding: '20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.15)'
                  }}>
                    <h2 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px', fontWeight: '800' }}>
                      🚀 Startup Launch Roadmap: {project.name}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0, fontSize: '13px' }}>
                      This chronological pipeline details the strategic phases generated by your AI executive team. Follow this sequential blueprint to validate, fund, and launch your business.
                    </p>
                  </div>

                  {/* Timeline representation */}
                  <div style={{
                    position: 'relative',
                    paddingLeft: '28px',
                    borderLeft: '2px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '40px'
                  }}>
                    
                    {/* Phase 1: Market Validation */}
                    {market_report && (
                      <div style={{ position: 'relative' }}>
                        <div style={timelineBulletStyle}><span style={{ fontSize: '10px' }}>1</span></div>
                        <h3 style={phaseHeaderStyle}>Phase 1: Market Validation & Opportunity</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                          Establish addressable market volumes, growth CAGRs, and outline potential demographic segments.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                          <div style={statBoxStyle}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TAM (Total Market)</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '4px' }}>{market_report.market_size_tam}</div>
                          </div>
                          <div style={statBoxStyle}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SAM (Serviceable Market)</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)', marginTop: '4px' }}>{market_report.market_size_sam}</div>
                          </div>
                          <div style={statBoxStyle}>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOM (Launch Target)</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>{market_report.market_size_som}</div>
                          </div>
                        </div>

                        {competitor_analysis?.swot_analysis && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px' }}>
                              <strong style={{ color: 'var(--primary)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Core Opportunity</strong>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{competitor_analysis.swot_analysis.opportunities[0]}</p>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
                              <strong style={{ color: 'var(--danger)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>Key Risk / Threat</strong>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{competitor_analysis.swot_analysis.threats[0]}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Phase 2: Product MVP */}
                    {mvp_features && mvp_features.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <div style={timelineBulletStyle}><span style={{ fontSize: '10px' }}>2</span></div>
                        <h3 style={phaseHeaderStyle}>Phase 2: Product MVP & Scope Roadmap</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                          Prioritized product release phases with estimated development timelines.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {mvp_features.slice(0, 3).map(feat => (
                            <div key={feat.id} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px 16px',
                              background: 'rgba(255, 255, 255, 0.01)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              borderRadius: '8px',
                              gap: '12px'
                            }}>
                              <div>
                                <strong style={{ color: 'var(--secondary)', fontSize: '13px' }}>{feat.name}</strong>
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0', lineHeight: '1.4' }}>{feat.description}</p>
                              </div>
                              <div style={{ textAlign: 'right', minWidth: '110px' }}>
                                <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                  {feat.tier}
                                </span>
                                <div style={{ fontSize: '10px', marginTop: '6px', color: 'var(--text-muted)' }}>{feat.effort}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phase 3: Brand system & User flow */}
                    {design_guidelines?.design_system && (
                      <div style={{ position: 'relative' }}>
                        <div style={timelineBulletStyle}><span style={{ fontSize: '10px' }}>3</span></div>
                        <h3 style={phaseHeaderStyle}>Phase 3: Brand Guidelines & User Flow GUI</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                          Custom design guidelines, typography, and functional startup journey flows.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Colors:</span>
                            {design_guidelines.design_system.color_palette.map((c, idx) => {
                              const hex = c.split(' ')[0];
                              return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                                  <span style={{ color: '#fff' }}>{c}</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* User Flow GUI step line */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '12px',
                            background: 'rgba(255,255,255,0.01)',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.04)'
                          }}>
                            {design_guidelines.user_flow.map((flow, idx) => (
                              <div key={idx} style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <strong style={{ color: 'var(--primary)' }}>{flow.step}</strong>
                                <div style={{ color: '#fff', fontWeight: 'bold' }}>{flow.action}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.4' }}>{flow.outcome}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Phase 4: GTM Timeline */}
                    {marketing_plan?.timeline_90_days && (
                      <div style={{ position: 'relative' }}>
                        <div style={timelineBulletStyle}><span style={{ fontSize: '10px' }}>4</span></div>
                        <h3 style={phaseHeaderStyle}>Phase 4: GTM Marketing Launch Timeline</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                          Chronological acquisition schedule checklist for the first 90 days.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          {marketing_plan.timeline_90_days.map((item, idx) => (
                            <div key={idx} style={{
                              padding: '14px',
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.04)',
                              borderRadius: '8px'
                            }}>
                              <strong style={{ color: 'var(--warning)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                                Days {item.days} Roadmap
                              </strong>
                              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {item.tasks.map((task, i) => <li key={i}>{task}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phase 5: Finance projections */}
                    {revenue_model && (
                      <div style={{ position: 'relative' }}>
                        <div style={timelineBulletStyle}><span style={{ fontSize: '10px' }}>5</span></div>
                        <h3 style={phaseHeaderStyle}>Phase 5: Financial Economic Projections</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                          Projections and ARR forecast modeling based on pricing defaults.
                        </p>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '16px',
                          background: 'rgba(255,255,255,0.01)',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.04)'
                        }}>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Year 1 MRR</div>
                            <strong style={{ fontSize: '20px', color: 'var(--primary)', display: 'block', marginTop: '4px' }}>
                              ${finalMRR.toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Year 1 ARR</div>
                            <strong style={{ fontSize: '20px', color: 'var(--secondary)', display: 'block', marginTop: '4px' }}>
                              ${finalARR.toLocaleString()}
                            </strong>
                          </div>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: '1.5', margin: '10px 0 0 0' }}>
                          {revenue_model.projections_narrative}
                        </p>
                      </div>
                    )}

                    {/* Phase 6: Compliance */}
                    {legal_checklist && legal_checklist.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <div style={timelineBulletStyle}><span style={{ fontSize: '10px' }}>6</span></div>
                        <h3 style={phaseHeaderStyle}>Phase 6: Regulatory Audit & Compliance Roadmap</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                          Audit guidelines required to shield operations and complete incorporation.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {legal_checklist.map((item, idx) => (
                            <div key={idx} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              background: 'rgba(255,255,255,0.01)',
                              border: '1px solid rgba(255,255,255,0.03)',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}>
                              <div>
                                <strong style={{ color: '#fff' }}>{item.topic}</strong>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '12px' }}>{item.compliance}</span>
                              </div>
                              <span style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: 'bold' }}>
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* 2. CEO Coordinator Tab */}
              {activeTab === 'ceo' && pitch_deck && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>Executive Summary Audit</div>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    lineHeight: '1.6',
                    fontSize: '13px'
                  }}>
                    {executive_summary}
                  </div>
                  
                  <div style={sectionHeaderStyle}>10-Slide Pitch Deck Framework</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pitch_deck.map(slide => (
                      <div key={slide.slide} style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.03)',
                        padding: '14px',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '13px' }}>Slide {slide.slide}: {slide.title}</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {slide.bullets.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Market Research Tab */}
              {activeTab === 'market' && market_report && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>TAM, SAM, SOM Proportions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={dataRowStyle}><strong>TAM (Total Addressable Market):</strong> <span>{market_report.market_size_tam}</span></div>
                    <div style={dataRowStyle}><strong>SAM (Serviceable Addressable Market):</strong> <span>{market_report.market_size_sam}</span></div>
                    <div style={dataRowStyle}><strong>SOM (Serviceable Obtainable Market):</strong> <span>{market_report.market_size_som}</span></div>
                    <div style={dataRowStyle}><strong>Annual Growth Rate (CAGR):</strong> <span>{market_report.growth_rate_cagr}</span></div>
                  </div>

                  <div style={sectionHeaderStyle}>Target Customer Profile</div>
                  <div style={{
                    padding: '14px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.6'
                  }}>
                    {market_report.target_demographics}
                  </div>

                  <div style={sectionHeaderStyle}>Market Entry Barriers</div>
                  <div style={{
                    padding: '14px',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'var(--text-muted)'
                  }}>
                    {market_report.market_barriers}
                  </div>
                </div>
              )}

              {/* 4. Competitor Analyst Tab */}
              {activeTab === 'competitor' && competitor_analysis && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>SWOT Matrix</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(16,185,129,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Strengths</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {competitor_analysis.swot_analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div style={{ background: 'rgba(239,68,68,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.1)' }}>
                      <strong style={{ color: 'var(--danger)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Weaknesses</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {competitor_analysis.swot_analysis.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                    <div style={{ background: 'rgba(14,165,233,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(14,165,233,0.1)' }}>
                      <strong style={{ color: 'var(--secondary)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Opportunities</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {competitor_analysis.swot_analysis.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.1)' }}>
                      <strong style={{ color: 'var(--warning)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Threats</strong>
                      <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {competitor_analysis.swot_analysis.threats.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div style={sectionHeaderStyle}>Competitor Landscape Profiles</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {competitor_analysis.competitors.map((comp, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        padding: '14px',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: '#fff', fontSize: '14px' }}>{comp.name}</strong>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div><strong>Strengths:</strong> {comp.strengths}</div>
                          <div><strong>Weaknesses:</strong> {comp.weaknesses}</div>
                          <div style={{ color: 'var(--primary)', marginTop: '2px' }}><strong>Our Strategic Edge:</strong> {comp.our_advantage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Product MVP Tab */}
              {activeTab === 'product' && mvp_features && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>MVP Feature Scope Backlog</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {mvp_features.map(feat => (
                      <div key={feat.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: '14px 16px',
                        borderRadius: '8px',
                        gap: '16px'
                      }}>
                        <div>
                          <strong style={{ color: 'var(--secondary)', fontSize: '14px' }}>{feat.name}</strong>
                          <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '4px 0 0 0', lineHeight: '1.5' }}>{feat.description}</p>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '110px' }}>
                          <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {feat.tier}
                          </span>
                          <div style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '6px', fontWeight: 'bold' }}>{feat.effort}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. UI/UX Designer Tab */}
              {activeTab === 'design' && design_guidelines && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>Theme & Brand Identity</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={dataRowStyle}><strong>Typography System:</strong> <span>{design_guidelines.design_system.typography}</span></div>
                    <div style={dataRowStyle}><strong>Interface Theme Style:</strong> <span>{design_guidelines.design_system.theme}</span></div>
                  </div>

                  <div style={sectionHeaderStyle}>SaaS Brand Color Spectrum</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {design_guidelines.design_system.color_palette.map((color, idx) => {
                      const hex = color.split(' ')[0];
                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: 'rgba(255,255,255,0.01)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '12px'
                        }}>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                          <span style={{ color: '#fff' }}>{color}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={sectionHeaderStyle}>User Journey Interaction Flows</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {design_guidelines.user_flow.map((flow, i) => (
                      <div key={i} style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        padding: '14px',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                          {flow.step}
                        </strong>
                        <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>Action: {flow.action}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>System Outcome: {flow.outcome}</div>
                      </div>
                    ))}
                  </div>

                  <div style={sectionHeaderStyle}>Dashboard Layout Specifications</div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.01)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.04)',
                    fontSize: '12px'
                  }}>
                    <div><strong style={{ color: 'var(--secondary)' }}>Dashboard Header:</strong> {design_guidelines.wireframe_specification.header}</div>
                    <div><strong style={{ color: 'var(--secondary)' }}>Main Hub Section:</strong> {design_guidelines.wireframe_specification.hero_section}</div>
                    <div><strong style={{ color: 'var(--secondary)' }}>Interactive Metrics Area:</strong> {design_guidelines.wireframe_specification.core_feature_section}</div>
                    <div><strong style={{ color: 'var(--secondary)' }}>Call To Action Interface:</strong> {design_guidelines.wireframe_specification.call_to_action}</div>
                  </div>
                </div>
              )}

              {/* 7. Marketing Specialist Tab */}
              {activeTab === 'marketing' && marketing_plan && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>GTM Launch Acquisition Channels</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {marketing_plan.gtm_channels.map((ch, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: '14px',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: 'var(--warning)', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                          {ch.channel}
                        </strong>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {ch.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={sectionHeaderStyle}>90-Day Execution Milestones</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {marketing_plan.timeline_90_days.map((item, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        padding: '14px',
                        borderRadius: '8px'
                      }}>
                        <strong style={{ color: '#fff', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                          Days {item.days} Tasks Checklist
                        </strong>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.tasks.map((task, i) => <li key={i}>{task}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Finance Planner Tab */}
              {activeTab === 'finance' && revenue_model && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>SaaS Subscription Pricing Architecture</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={dataRowStyle}><strong>Free Account Limitations:</strong> <span>{revenue_model.pricing.free_tier_limit}</span></div>
                    <div style={dataRowStyle}><strong>Premium Cost structure:</strong> <span>${premiumPrice} / month</span></div>
                    <div style={dataRowStyle}><strong>Enterprise Cost structure:</strong> <span>${enterprisePrice} / month</span></div>
                  </div>

                  <div style={sectionHeaderStyle}>Interactive Projection Calculator</div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'rgba(255,255,255,0.01)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.04)'
                  }}>
                    <div style={sliderRowStyle}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Monthly Traffic Visitors</span>
                        <strong>{monthlyVisitors.toLocaleString()}</strong>
                      </label>
                      <input
                        type="range" min="1000" max="100000" step="500"
                        value={monthlyVisitors} onChange={(e) => setMonthlyVisitors(parseInt(e.target.value))}
                        style={sliderStyle}
                      />
                    </div>
                    
                    <div style={sliderRowStyle}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Paid Subscriber Conversion</span>
                        <strong>{conversionRate}%</strong>
                      </label>
                      <input
                        type="range" min="0.5" max="10" step="0.1"
                        value={conversionRate} onChange={(e) => setConversionRate(parseFloat(e.target.value))}
                        style={sliderStyle}
                      />
                    </div>
                    
                    <div style={sliderRowStyle}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Monthly Customer Churn</span>
                        <strong>{churnRate}%</strong>
                      </label>
                      <input
                        type="range" min="1" max="20" step="0.5"
                        value={churnRate} onChange={(e) => setChurnRate(parseFloat(e.target.value))}
                        style={sliderStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                      <div style={statBoxStyle}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Month 12 MRR</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginTop: '4px' }}>${finalMRR.toLocaleString()}</div>
                      </div>
                      <div style={statBoxStyle}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>ARR Run Rate</div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--secondary)', marginTop: '4px' }}>${finalARR.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                    {revenue_model.projections_narrative}
                  </p>
                </div>
              )}

              {/* 9. Legal & Compliance Tab */}
              {activeTab === 'legal' && legal_checklist && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={sectionHeaderStyle}>Startup Legal & Regulatory Checklist</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {legal_checklist.map((item, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: '14px',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ color: 'var(--warning)', fontSize: '13px' }}>{item.topic}</strong>
                          <span style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                            {item.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {item.compliance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* Retraining & Refinement Center */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--border)', borderRadius: '12px' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', color: 'var(--primary)' }}>
          🔄 CEO Agent Retraining & Refinement Center
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Select specific agents and provide critical feedback. The CEO will orchestrate a critique and edit loop to update relevant business plans.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Checkboxes for Agents */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'market', label: '📊 Market Agent' },
              { key: 'competitor', label: '🔍 Competitor Agent' },
              { key: 'product', label: '📦 Product Agent' },
              { key: 'design', label: '🎨 UI/UX Agent' },
              { key: 'finance', label: '💵 Finance Agent' },
              { key: 'marketing', label: '📢 Marketing Agent' },
              { key: 'legal', label: '⚖️ Legal Agent' }
            ].map(agent => {
              const isChecked = selectedAgents.includes(agent.key);
              return (
                <button
                  key={agent.key}
                  onClick={() => handleAgentToggle(agent.key)}
                  style={{
                    background: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    border: '1px solid ' + (isChecked ? 'var(--primary)' : 'var(--border)'),
                    color: isChecked ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                  disabled={refining}
                >
                  {isChecked ? '✓ ' : ''}{agent.label}
                </button>
              );
            })}
          </div>

          {/* Feedback Input box */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Optimize GTM roadmap / Add crop health scan step to user flow..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{ flex: 1 }}
              disabled={refining}
            />
            <button
              onClick={handleRefineSubmit}
              className="btn btn-primary"
              disabled={refining || !feedbackText.trim() || selectedAgents.length === 0}
            >
              {refining ? 'Refining...' : 'Orchestrate Refinement'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

// Styles
const timelineBulletStyle = {
  position: 'absolute',
  left: '-37px',
  top: '2px',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: '#070b16',
  border: '2px solid var(--primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 'bold',
  boxShadow: '0 0 8px var(--primary)'
};

const phaseHeaderStyle = {
  fontSize: '15px',
  fontWeight: '800',
  color: '#fff',
  marginBottom: '4px'
};

const statBoxStyle = {
  background: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '10px 14px',
  borderRadius: '8px'
};

const sliderRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const sliderStyle = {
  width: '100%',
  height: '6px',
  borderRadius: '4px',
  background: 'rgba(255,255,255,0.1)',
  outline: 'none',
  cursor: 'pointer',
  accentColor: 'var(--primary)'
};

const sectionHeaderStyle = {
  fontSize: '11px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  color: 'var(--primary)',
  letterSpacing: '0.05em',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  paddingBottom: '4px',
  marginTop: '8px',
  marginBottom: '8px'
};

const dataRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '13px',
  padding: '6px 0',
  borderBottom: '1px solid rgba(255,255,255,0.02)'
};
