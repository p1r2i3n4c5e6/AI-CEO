from typing import Optional
from app.llm import GeminiClient

class BaseAgent:
    def __init__(self, name: str, role: str, system_prompt: str, temperature: float = 0.7):
        self.name = name
        self.role = role
        self.system_prompt = system_prompt
        self.temperature = temperature

    async def execute(
        self,
        prompt: str,
        api_key: Optional[str] = None,
        model: str = "gemini-2.0-flash",
        json_mode: bool = False,
        system_prompt: Optional[str] = None
    ) -> str:
        # Full prompt integrates the system rules with the dynamic task instruction
        sys_prompt = system_prompt or self.system_prompt
        full_prompt = (
            f"SYSTEM ROLE: {sys_prompt}\n\n"
            f"TASK INSTRUCTION:\n{prompt}\n\n"
            "Provide your response directly. "
        )
        if json_mode:
            full_prompt += "Ensure your output is a valid JSON object matching the requested schema."

        return await GeminiClient.call_gemini(
            prompt=full_prompt,
            api_key=api_key,
            model=model,
            temperature=self.temperature,
            json_mode=json_mode
        )
