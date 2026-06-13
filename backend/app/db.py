import os
import json
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "ai_ceo_database"

# Fallback directory under backend folder
FALLBACK_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "db_fallback")

class Database:
    def __init__(self):
        self.use_fallback = True
        self.client = None
        self.db = None
        
    async def init_db(self, custom_uri: str = None):
        uri = custom_uri or os.getenv("MONGO_URI", MONGO_URI)
        try:
            # Initialize with 2-second timeout to fail-fast if no server is running
            self.client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=2000)
            # Ping database to check if server is reachable
            await self.client.admin.command('ping')
            self.db = self.client[DB_NAME]
            self.use_fallback = False
            print(f"Successfully connected to MongoDB at {uri}")
        except Exception as e:
            print(f"MongoDB connection failed: {e}. Falling back to JSON file storage.")
            self.use_fallback = True
            os.makedirs(FALLBACK_DIR, exist_ok=True)
            os.makedirs(os.path.join(FALLBACK_DIR, "projects"), exist_ok=True)
            os.makedirs(os.path.join(FALLBACK_DIR, "messages"), exist_ok=True)

    async def get_project(self, project_id: str):
        if not self.use_fallback and self.db is not None:
            doc = await self.db.projects.find_one({"id": project_id})
            if doc and "_id" in doc:
                doc["_id"] = str(doc["_id"])
            return doc
        else:
            filepath = os.path.join(FALLBACK_DIR, "projects", f"{project_id}.json")
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            return None

    async def save_project(self, project_data: dict):
        project_id = project_data["id"]
        if not self.use_fallback and self.db is not None:
            # We create a copy to avoid mutating the original dict or saving non-serializable elements
            data = dict(project_data)
            if "_id" in data:
                del data["_id"]
            await self.db.projects.replace_one({"id": project_id}, data, upsert=True)
        else:
            filepath = os.path.join(FALLBACK_DIR, "projects", f"{project_id}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(project_data, f, indent=2, default=str)
        return project_data

    async def list_projects(self):
        if not self.use_fallback and self.db is not None:
            cursor = self.db.projects.find({}, {"id": 1, "name": 1, "idea": 1, "status": 1, "created_at": 1})
            projects = []
            async for doc in cursor:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                projects.append(doc)
            return projects
        else:
            projects = []
            proj_dir = os.path.join(FALLBACK_DIR, "projects")
            if os.path.exists(proj_dir):
                for filename in os.listdir(proj_dir):
                    if filename.endswith(".json"):
                        filepath = os.path.join(proj_dir, filename)
                        try:
                            with open(filepath, "r", encoding="utf-8") as f:
                                data = json.load(f)
                                projects.append({
                                    "id": data.get("id"),
                                    "name": data.get("name"),
                                    "idea": data.get("idea"),
                                    "status": data.get("status"),
                                    "created_at": data.get("created_at")
                                })
                        except Exception:
                            pass
            # Sort by created_at descending if possible
            projects.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return projects

    async def save_message(self, message: dict):
        if not self.use_fallback and self.db is not None:
            data = dict(message)
            if "_id" in data:
                del data["_id"]
            await self.db.messages.insert_one(data)
        else:
            project_id = message["project_id"]
            msg_dir = os.path.join(FALLBACK_DIR, "messages", project_id)
            os.makedirs(msg_dir, exist_ok=True)
            msg_id = message.get("id") or f"{message.get('timestamp')}_{message.get('sender')}"
            # Replace spaces and special characters for a clean file name
            safe_msg_id = "".join([c if c.isalnum() else "_" for c in msg_id])
            filepath = os.path.join(msg_dir, f"{safe_msg_id}.json")
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(message, f, indent=2, default=str)

    async def get_messages(self, project_id: str):
        if not self.use_fallback and self.db is not None:
            cursor = self.db.messages.find({"project_id": project_id}).sort("timestamp", 1)
            messages = []
            async for doc in cursor:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                messages.append(doc)
            return messages
        else:
            messages = []
            msg_dir = os.path.join(FALLBACK_DIR, "messages", project_id)
            if os.path.exists(msg_dir):
                files = []
                for filename in os.listdir(msg_dir):
                    if filename.endswith(".json"):
                        files.append(filename)
                # Sort filenames to retrieve messages chronologically
                files.sort()
                for filename in files:
                    filepath = os.path.join(msg_dir, filename)
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            messages.append(json.load(f))
                    except Exception:
                        pass
            return messages

db = Database()
