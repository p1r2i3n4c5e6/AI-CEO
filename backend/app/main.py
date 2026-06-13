import os
import uuid
import datetime
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
from contextlib import asynccontextmanager

from app.db import db
from app.models import ProjectCreate, FeedbackRequest, ProjectResponse
from app.orchestrator import Orchestrator

# Connection Manager for WebSockets
class ConnectionManager:
    def __init__(self):
        # project_id -> list of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, project_id: str, websocket: WebSocket):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)
        print(f"WebSocket connected for project: {project_id}")

    def disconnect(self, project_id: str, websocket: WebSocket):
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
        print(f"WebSocket disconnected for project: {project_id}")

    async def broadcast_to_project(self, project_id: str, message: dict):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message on socket: {e}")

manager = ConnectionManager()

# Broadcast callback passed to orchestrator
async def websocket_broadcast_callback(project_id: str, payload: dict):
    await manager.broadcast_to_project(project_id, payload)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB (looks for MONGO_URI in environment)
    await db.init_db()
    yield

app = FastAPI(title="AI CEO - Company-in-a-Box API", lifespan=lifespan)

# Allow CORS for local dev environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo / development convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI CEO Backend running successfully."}

@app.get("/projects")
async def get_projects():
    projects = await db.list_projects()
    return projects

@app.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/projects/{project_id}/messages")
async def get_messages(project_id: str):
    messages = await db.get_messages(project_id)
    return messages

@app.post("/projects")
async def create_project(data: ProjectCreate, background_tasks: BackgroundTasks):
    project_id = str(uuid.uuid4())
    
    project_doc = {
        "id": project_id,
        "name": "Generating...",
        "idea": data.idea,
        "status": "generating",
        "created_at": datetime.datetime.now().isoformat(),
        "api_key_configured": bool(data.api_key),
        "artifacts": {}
    }
    
    # Save pending state
    await db.save_project(project_doc)
    
    # Run orchestration as a background task to return project_id immediately to the client
    background_tasks.add_task(
        Orchestrator.run_full_generation,
        project_id=project_id,
        idea=data.idea,
        api_key=data.api_key,
        model_name=data.model_name,
        broadcast_cb=websocket_broadcast_callback,
        selected_agents=data.selected_agents
    )
    
    return {"project_id": project_id}

@app.post("/projects/refine")
async def refine_project(data: FeedbackRequest, background_tasks: BackgroundTasks):
    project = await db.get_project(data.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    background_tasks.add_task(
        Orchestrator.run_refinement,
        project_id=data.project_id,
        feedback=data.feedback,
        selected_agents=data.selected_agents,
        api_key=data.api_key,
        broadcast_cb=websocket_broadcast_callback
    )
    
    return {"status": "refining"}

@app.post("/projects/{project_id}/agent-configs")
async def update_agent_configs(project_id: str, configs: dict):
    project = await db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project configurations
    current_configs = project.get("agent_configs", {})
    current_configs.update(configs)
    project["agent_configs"] = current_configs
    
    await db.save_project(project)
    return {"status": "configs_updated", "agent_configs": project["agent_configs"]}


@app.get("/agent-defaults")
async def get_agent_defaults():
    from app.agents.specific_agents import (
        CEO_SYSTEM_PROMPT,
        MARKET_RESEARCH_SYSTEM_PROMPT,
        COMPETITOR_SYSTEM_PROMPT,
        PRODUCT_MANAGER_SYSTEM_PROMPT,
        UI_UX_SYSTEM_PROMPT,
        MARKETING_SYSTEM_PROMPT,
        FINANCE_SYSTEM_PROMPT,
        LEGAL_SYSTEM_PROMPT
    )
    return {
        "ceo": CEO_SYSTEM_PROMPT,
        "market": MARKET_RESEARCH_SYSTEM_PROMPT,
        "competitor": COMPETITOR_SYSTEM_PROMPT,
        "product": PRODUCT_MANAGER_SYSTEM_PROMPT,
        "design": UI_UX_SYSTEM_PROMPT,
        "marketing": MARKETING_SYSTEM_PROMPT,
        "finance": FINANCE_SYSTEM_PROMPT,
        "legal": LEGAL_SYSTEM_PROMPT
    }



@app.websocket("/ws/projects/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    await manager.connect(project_id, websocket)
    try:
        # Keep connection open and listen for client messages if any
        while True:
            # We can expand this to handle mid-generation pause/resume or additional signals
            data = await websocket.receive_text()
            print(f"Received from client on socket: {data}")
    except WebSocketDisconnect:
        manager.disconnect(project_id, websocket)
    except Exception as e:
        print(f"WebSocket connection error: {e}")
        manager.disconnect(project_id, websocket)
