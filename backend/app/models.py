from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ProjectCreate(BaseModel):
    idea: str = Field(..., description="Startup idea described by the user")
    api_key: Optional[str] = Field(None, description="Optional Google Gemini API Key")
    model_name: Optional[str] = Field("gemini-2.0-flash", description="LLM model name to use")
    selected_agents: Optional[List[str]] = Field(default=None, description="List of agents to run (e.g. ['market', 'product'])")

class FeedbackRequest(BaseModel):
    project_id: str
    feedback: str
    selected_agents: List[str] = Field(..., description="List of agents to refine (e.g. ['market', 'product'])")
    api_key: Optional[str] = None

class AgentMessageSchema(BaseModel):
    project_id: str
    sender: str
    recipient: str
    message: str
    status: str  # 'thinking', 'completed', 'critique', 'refining'
    timestamp: float

class ProjectResponse(BaseModel):
    id: str
    name: str
    idea: str
    status: str  # 'pending', 'generating', 'completed', 'failed', 'refining'
    created_at: str
    api_key_configured: bool
    artifacts: Dict[str, Any] = Field(default_factory=dict)
    # Artifact keys:
    # - executive_summary: str
    # - market_report: Dict[str, Any]
    # - competitor_analysis: Dict[str, Any]
    # - mvp_features: List[Dict[str, Any]]
    # - landing_page: Dict[str, str] (html, css)
    # - pitch_deck: List[Dict[str, str]] (title, bullet points)
    # - marketing_plan: Dict[str, Any]
    # - revenue_model: Dict[str, Any]
    # - legal_checklist: List[Dict[str, Any]]
