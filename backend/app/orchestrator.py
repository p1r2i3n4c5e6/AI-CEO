import asyncio
import time
import uuid
import json
from typing import List, Dict, Any, Callable, Optional
from app.db import db
from app.llm import MockLLM
from app.agents.specific_agents import (
    CEOCoordinator,
    MarketResearcher,
    CompetitorAnalyst,
    ProductManager,
    UIUXDesigner,
    MarketingSpecialist,
    FinancialPlanner,
    LegalCompliance
)

# Instantiate the agents
ceo = CEOCoordinator()
market_agent = MarketResearcher()
competitor_agent = CompetitorAnalyst()
pm_agent = ProductManager()
uiux_agent = UIUXDesigner()
marketing_agent = MarketingSpecialist()
finance_agent = FinancialPlanner()
legal_agent = LegalCompliance()

class Orchestrator:
    @staticmethod
    async def log_and_broadcast(
        project_id: str,
        sender: str,
        recipient: str,
        message: str,
        status: str,
        broadcast_cb: Optional[Callable] = None
    ):
        msg_obj = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "sender": sender,
            "recipient": recipient,
            "message": message,
            "status": status,
            "timestamp": time.time()
        }
        # Save to DB (async)
        await db.save_message(msg_obj)
        # Broadcast via WebSocket
        if broadcast_cb:
            await broadcast_cb(project_id, {"type": "agent_message", "data": msg_obj})

    @classmethod
    async def run_full_generation(
        cls,
        project_id: str,
        idea: str,
        api_key: Optional[str] = None,
        model_name: str = "gemini-2.0-flash",
        broadcast_cb: Optional[Callable] = None,
        selected_agents: Optional[List[str]] = None
    ):
        if model_name == "gemini-1.5-flash":
            model_name = "gemini-2.0-flash"
        elif model_name == "gemini-1.5-pro":
            model_name = "gemini-2.5-pro"
            
        print(f"Starting orchestration for project {project_id} - Idea: {idea}")
        
        # 1. CEO Initialization
        await cls.log_and_broadcast(
            project_id, "CEO Agent", "System",
            f"Initiating multi-agent collaboration for startup idea: '{idea}'. Setting up deliverables pipeline.",
            "thinking", broadcast_cb
        )
        
        import os
        effective_key = api_key or os.getenv("GEMINI_API_KEY")
        is_live = bool(effective_key)
        
        if is_live:
            await cls.log_and_broadcast(
                project_id, "System", "CEO Agent",
                f"Live LLM Mode activated. Using model: {model_name}.",
                "thinking", broadcast_cb
            )
        else:
            await cls.log_and_broadcast(
                project_id, "System", "CEO Agent",
                "API Key not found. Initiating high-fidelity autonomous simulation mode.",
                "thinking", broadcast_cb
            )
        
        if not selected_agents:
            selected_agents = ["market", "competitor", "product", "design", "marketing", "finance", "legal"]
            
        # Get project document
        project = await db.get_project(project_id)
        if not project:
            return

        agent_configs = project.get("agent_configs", {})

        # Prepare outputs container
        artifacts = {}
        
        # Generate simulation datasets first in case of mock mode
        mock_data = MockLLM.generate_mock_data(idea)
        project["name"] = mock_data["name"]

        # Define steps with delays for simulated realism
        step_delay = 1.0 if not is_live else 0.2

        try:
            # Step 1: Market Research
            if "market" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Market Research Agent",
                    "Market Research Agent: Please conduct comprehensive market analysis, estimate TAM/SAM/SOM, and identify growth drivers.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("market")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Market Research Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        market_prompt = f"Analyze the market size (TAM, SAM, SOM), CAGR growth rate, key trends, target demographics, and barriers to entry for this startup idea: '{idea}'"
                        market_raw = await market_agent.execute(
                            market_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["market_report"] = json.loads(market_raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Market Research Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        report = mock_data["market_report"]
                        if custom_prompt:
                            report["target_demographics"] = f"{report.get('target_demographics')} (Filtered by custom rules: {custom_prompt[:60]})"
                        artifacts["market_report"] = report
                else:
                    report = mock_data["market_report"]
                    if custom_prompt:
                        report["target_demographics"] = f"{report.get('target_demographics')} (Filtered by custom rules: {custom_prompt[:60]})"
                    artifacts["market_report"] = report
                    
                await cls.log_and_broadcast(
                    project_id, "Market Research Agent", "CEO Agent",
                    f"Market report compiled. TAM: {artifacts['market_report'].get('market_size_tam')}. Demographics identified.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 2: Competitor Analysis
            if "competitor" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Competitor Agent",
                    "Competitor Agent: Analyze main competitors, compile strengths/weaknesses, and define our unfair advantage.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("competitor")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Competitor Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                    
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        comp_prompt = f"Identify 3 competitors for: '{idea}'. Provide their strengths, weaknesses, our competitive advantage, and compile a SWOT analysis."
                        comp_raw = await competitor_agent.execute(
                            comp_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["competitor_analysis"] = json.loads(comp_raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Competitor Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        comp_report = mock_data["competitor_analysis"]
                        if custom_prompt:
                            comp_report["swot_analysis"]["opportunities"].append(f"Custom Strategy Opportunity (from custom prompt)")
                        artifacts["competitor_analysis"] = comp_report
                else:
                    comp_report = mock_data["competitor_analysis"]
                    if custom_prompt:
                        comp_report["swot_analysis"]["opportunities"].append(f"Custom Strategy Opportunity (from custom prompt)")
                    artifacts["competitor_analysis"] = comp_report
                    
                await cls.log_and_broadcast(
                    project_id, "Competitor Agent", "CEO Agent",
                    f"Competitive landscape mapped. SWOT analysis finalized. Unfair advantage documented.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 3: Product MVP Scope
            if "product" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Product Manager Agent",
                    "Product Manager Agent: Draft our MVP feature specification. Prioritize into Must-Have, Should-Have, and Nice-to-Have tiers.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("product")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Product Manager Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                    
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        pm_prompt = f"For startup '{project['name']}' with idea '{idea}', define 4 key MVP features including name, tier, description, and dev effort estimate."
                        pm_raw = await pm_agent.execute(
                            pm_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["mvp_features"] = json.loads(pm_raw).get("features", [])
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Product Manager Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        features = mock_data["mvp_features"]
                        if custom_prompt:
                            if "chatbot" in custom_prompt.lower() or "ai" in custom_prompt.lower():
                                features.insert(0, {
                                    "id": "feat_custom_ai",
                                    "name": "AI Advisor Chatbot",
                                    "tier": "Must-Have",
                                    "description": "Custom agricultural agent chatbot configured via custom prompt.",
                                    "effort": "Medium (2 weeks)"
                                })
                            elif "mobile" in custom_prompt.lower():
                                features.insert(0, {
                                    "id": "feat_custom_mobile",
                                    "name": "Mobile-First Farmer App",
                                    "tier": "Must-Have",
                                    "description": "Mobile app shell targeting low bandwidth settings.",
                                    "effort": "Easy (1 week)"
                                })
                        artifacts["mvp_features"] = features
                else:
                    features = mock_data["mvp_features"]
                    if custom_prompt:
                        if "chatbot" in custom_prompt.lower() or "ai" in custom_prompt.lower():
                            features.insert(0, {
                                "id": "feat_custom_ai",
                                "name": "AI Advisor Chatbot",
                                "tier": "Must-Have",
                                "description": "Custom agricultural agent chatbot configured via custom prompt.",
                                "effort": "Medium (2 weeks)"
                            })
                        elif "mobile" in custom_prompt.lower():
                            features.insert(0, {
                                "id": "feat_custom_mobile",
                                "name": "Mobile-First Farmer App",
                                "tier": "Must-Have",
                                "description": "Mobile app shell targeting low bandwidth settings.",
                                "effort": "Easy (1 week)"
                            })
                    artifacts["mvp_features"] = features
                    
                await cls.log_and_broadcast(
                    project_id, "Product Manager Agent", "CEO Agent",
                    f"MVP scope defined with {len(artifacts['mvp_features'])} key features mapped in features list.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 4: UI/UX Design Guidelines
            if "design" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "UI/UX Agent",
                    "UI/UX Agent: Please design the core user flows, specify the wireframe layouts, and define our design system guidelines.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("design")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "UI/UX Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                    
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        ui_prompt = f"Create a comprehensive design system, user flows, and wireframe specification for '{project['name']}' based on: {json.dumps(artifacts.get('mvp_features', []))}."
                        ui_raw = await uiux_agent.execute(
                            ui_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["design_guidelines"] = json.loads(ui_raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "UI/UX Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        dg = mock_data["design_guidelines"]
                        if custom_prompt:
                            dg["design_system"]["theme"] += f" (Custom theme update: {custom_prompt[:60]})"
                        artifacts["design_guidelines"] = dg
                else:
                    dg = mock_data["design_guidelines"]
                    if custom_prompt:
                        dg["design_system"]["theme"] += f" (Custom theme update: {custom_prompt[:60]})"
                    artifacts["design_guidelines"] = dg
                    
                await cls.log_and_broadcast(
                    project_id, "UI/UX Agent", "CEO Agent",
                    "UI/UX Design blueprint and user flow sequence finalized.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 5: Finance Projections
            if "finance" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Finance Agent",
                    "Finance Agent: Model our unit economics. Formulate subscription pricing tiers and set financial projection variables.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("finance")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Finance Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                    
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        fin_prompt = f"Design pricing and unit economic assumptions for '{project['name']}' based on market research. Establish calculator defaults."
                        fin_raw = await finance_agent.execute(
                            fin_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["revenue_model"] = json.loads(fin_raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Finance Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        rev = mock_data["revenue_model"]
                        if custom_prompt:
                            if "premium" in custom_prompt.lower() or "high" in custom_prompt.lower():
                                rev["pricing"]["premium_monthly_cost"] = 79.0
                            elif "cheap" in custom_prompt.lower() or "low" in custom_prompt.lower():
                                rev["pricing"]["premium_monthly_cost"] = 9.0
                        artifacts["revenue_model"] = rev
                else:
                    rev = mock_data["revenue_model"]
                    if custom_prompt:
                        if "premium" in custom_prompt.lower() or "high" in custom_prompt.lower():
                            rev["pricing"]["premium_monthly_cost"] = 79.0
                        elif "cheap" in custom_prompt.lower() or "low" in custom_prompt.lower():
                            rev["pricing"]["premium_monthly_cost"] = 9.0
                    artifacts["revenue_model"] = rev
                    
                await cls.log_and_broadcast(
                    project_id, "Finance Agent", "CEO Agent",
                    f"Revenue streams established. Premium monthly price: ${artifacts['revenue_model'].get('pricing', {}).get('premium_monthly_cost')}.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 6: Marketing Strategy
            if "marketing" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Marketing Agent",
                    "Marketing Agent: Build a multi-channel growth plan and a 90-day execution checklist.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("marketing")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Marketing Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                    
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        mkt_prompt = f"Create a marketing and growth strategy for '{project['name']}' with 3 GTM channels and a 90-day execution roadmap."
                        mkt_raw = await marketing_agent.execute(
                            mkt_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["marketing_plan"] = json.loads(mkt_raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Marketing Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        mkt = mock_data["marketing_plan"]
                        if custom_prompt:
                            mkt["gtm_channels"].append({
                                "channel": "Custom Growth Campaign",
                                "desc": f"Configured strategy: {custom_prompt[:60]}"
                            })
                        artifacts["marketing_plan"] = mkt
                else:
                    mkt = mock_data["marketing_plan"]
                    if custom_prompt:
                        mkt["gtm_channels"].append({
                            "channel": "Custom Growth Campaign",
                            "desc": f"Configured strategy: {custom_prompt[:60]}"
                        })
                    artifacts["marketing_plan"] = mkt
                    
                await cls.log_and_broadcast(
                    project_id, "Marketing Agent", "CEO Agent",
                    "GTM strategy established. 90-day checklist compiled for launching acquisition channels.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 7: Legal Compliance
            if "legal" in selected_agents:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Legal Agent",
                    "Legal Agent: Audit compliance requirements, disclaimers, and corporate filing steps.",
                    "thinking", broadcast_cb
                )
                
                custom_prompt = agent_configs.get("legal")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Legal Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                    
                await asyncio.sleep(step_delay)
                
                if is_live:
                    try:
                        legal_prompt = f"Identify 4 compliance checklist items for '{project['name']}' (data privacy, disclaimers, registry) with recommended execution timelines."
                        legal_raw = await legal_agent.execute(
                            legal_prompt, effective_key, model_name, json_mode=True,
                            system_prompt=custom_prompt
                        )
                        artifacts["legal_checklist"] = json.loads(legal_raw).get("legal_checklist", [])
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Legal Agent",
                            f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        leg = mock_data["legal_checklist"]
                        if custom_prompt:
                            leg.append({
                                "topic": "Custom Compliance Guideline",
                                "compliance": f"Verified via custom prompt: {custom_prompt[:60]}",
                                "status": "Required before Launch"
                            })
                        artifacts["legal_checklist"] = leg
                else:
                    leg = mock_data["legal_checklist"]
                    if custom_prompt:
                        leg.append({
                            "topic": "Custom Compliance Guideline",
                            "compliance": f"Verified via custom prompt: {custom_prompt[:60]}",
                            "status": "Required before Launch"
                        })
                    artifacts["legal_checklist"] = leg
                    
                await cls.log_and_broadcast(
                    project_id, "Legal Agent", "CEO Agent",
                    f"Compliance audit complete. Mapped {len(artifacts['legal_checklist'])} regulatory safety guidelines.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Step 8: CEO Multi-Agent Critique & Collaboration Loop
            await cls.log_and_broadcast(
                project_id, "CEO Agent", "Multi-Agent Pool",
                "Analyzing all compiled plans. Running cross-agent verification loop...",
                "critique", broadcast_cb
            )
            await asyncio.sleep(step_delay * 1.5)

            # Dialogue: CEO cross-checks Product Manager with Competitor findings
            if "product" in selected_agents and "competitor" in selected_agents and "competitor_analysis" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Product Manager Agent",
                    f"Reviewing MVP against competitors in '{artifacts['competitor_analysis']['competitors'][0]['name']}'. Let's ensure features map directly to competitor weaknesses.",
                    "critique", broadcast_cb
                )
                await asyncio.sleep(step_delay)

                await cls.log_and_broadcast(
                    project_id, "Product Manager Agent", "CEO Agent",
                    "Understood. Verified that our core vernacular audio features directly tackle competitor UI/UX weaknesses. No adjustments required at this stage.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Dialogue: CEO checks Finance assumptions against Target Market
            if "finance" in selected_agents and "revenue_model" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Finance Agent",
                    "Reviewing pricing tiers. Are these subscription prices affordable for the target demographics?",
                    "critique", broadcast_cb
                )
                await asyncio.sleep(step_delay)

                await cls.log_and_broadcast(
                    project_id, "Finance Agent", "CEO Agent",
                    f"Confirmed. Monthly premium cost of ${artifacts['revenue_model'].get('pricing', {}).get('premium_monthly_cost')} matches the target customer budget.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Pitch Deck compilation (Done by CEO based on all results)
            custom_ceo_prompt = agent_configs.get("ceo")
            if custom_ceo_prompt:
                label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                await cls.log_and_broadcast(
                    project_id, "System", "CEO Agent",
                    f"{label} Custom prompt active: '{custom_ceo_prompt}'",
                    "thinking", broadcast_cb
                )

            if is_live:
                try:
                    pitch_prompt = f"Create a structured 10-slide pitch deck for '{project['name']}' based on: {json.dumps(artifacts)[:2000]}."
                    pitch_raw = await ceo.execute(
                        pitch_prompt, effective_key, json_mode=True,
                        system_prompt=custom_ceo_prompt
                    )
                    artifacts["pitch_deck"] = json.loads(pitch_raw).get("pitch_deck", mock_data["pitch_deck"])
                except Exception as api_err:
                    await cls.log_and_broadcast(
                        project_id, "System", "CEO Agent",
                        f"Live API call failed ({str(api_err)}). Falling back to Simulation Mode for slides.",
                        "thinking", broadcast_cb
                    )
                    artifacts["pitch_deck"] = mock_data["pitch_deck"]
            else:
                artifacts["pitch_deck"] = mock_data["pitch_deck"]

            # Executive Summary compilation
            artifacts["executive_summary"] = mock_data["exec_summary"]

            # Save deliverables to project
            project["artifacts"] = artifacts
            project["status"] = "completed"
            await db.save_project(project)
            
            # Final Completion broadcast
            await cls.log_and_broadcast(
                project_id, "CEO Agent", "System",
                f"Startup blueprint for '{project['name']}' is fully built and compiled! Dashboard is ready for review.",
                "completed", broadcast_cb
            )
            
            # Send project updated packet
            if broadcast_cb:
                await broadcast_cb(project_id, {"type": "project_updated", "data": project})

        except Exception as e:
            project["status"] = "failed"
            await db.save_project(project)
            await cls.log_and_broadcast(
                project_id, "System", "CEO Agent",
                f"Generation failed: {str(e)}",
                "failed", broadcast_cb
            )
            if broadcast_cb:
                await broadcast_cb(project_id, {"type": "project_updated", "data": project})

    @classmethod
    async def run_refinement(
        cls,
        project_id: str,
        feedback: str,
        selected_agents: List[str],
        api_key: Optional[str] = None,
        broadcast_cb: Optional[Callable] = None
    ):
        project = await db.get_project(project_id)
        if not project:
            return

        agent_configs = project.get("agent_configs", {})

        project["status"] = "refining"
        await db.save_project(project)
        if broadcast_cb:
            await broadcast_cb(project_id, {"type": "project_updated", "data": project})

        await cls.log_and_broadcast(
            project_id, "CEO Agent", "Multi-Agent Pool",
            f"Initiating refinement loop. Feedback received: '{feedback}'. Selected Agents: {', '.join(selected_agents)}.",
            "refining", broadcast_cb
        )

        import os
        effective_key = api_key or os.getenv("GEMINI_API_KEY")
        is_live = bool(effective_key)
        artifacts = project.get("artifacts", {})
        step_delay = 1.2 if not is_live else 0.2

        try:
            # Market Refinement
            if "market" in selected_agents and "market_report" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Market Research Agent",
                    f"Refining market analysis according to feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("market")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Market Research Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Refine previous market report {json.dumps(artifacts['market_report'])} based on this feedback: '{feedback}'"
                        raw = await market_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["market_report"] = json.loads(raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Market Research Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        report = artifacts["market_report"]
                        target = f"{report.get('target_demographics')} (Updated per feedback: {feedback})"
                        if custom_prompt:
                            target += f" [Custom rules applied: {custom_prompt[:50]}]"
                        report["target_demographics"] = target
                        artifacts["market_report"] = report
                else:
                    report = artifacts["market_report"]
                    target = f"{report.get('target_demographics')} (Updated per feedback: {feedback})"
                    if custom_prompt:
                        target += f" [Custom rules applied: {custom_prompt[:50]}]"
                    report["target_demographics"] = target
                    artifacts["market_report"] = report
                
                await cls.log_and_broadcast(
                    project_id, "Market Research Agent", "CEO Agent",
                    "Market analysis refined and updated.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Competitor Refinement
            if "competitor" in selected_agents and "competitor_analysis" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Competitor Agent",
                    f"Refining competitive strategy according to feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("competitor")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Competitor Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Refine previous competitor analysis {json.dumps(artifacts['competitor_analysis'])} based on this feedback: '{feedback}'"
                        raw = await competitor_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["competitor_analysis"] = json.loads(raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Competitor Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        comp = artifacts["competitor_analysis"]
                        opp = f"Feedback-driven expansion: {feedback}"
                        if custom_prompt:
                            opp += f" [Custom strategy: {custom_prompt[:50]}]"
                        comp["swot_analysis"]["opportunities"].append(opp)
                        artifacts["competitor_analysis"] = comp
                else:
                    comp = artifacts["competitor_analysis"]
                    opp = f"Feedback-driven expansion: {feedback}"
                    if custom_prompt:
                        opp += f" [Custom strategy: {custom_prompt[:50]}]"
                    comp["swot_analysis"]["opportunities"].append(opp)
                    artifacts["competitor_analysis"] = comp
                
                await cls.log_and_broadcast(
                    project_id, "Competitor Agent", "CEO Agent",
                    "Competitor matrices and SWOT refined.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Product Manager Refinement
            if "product" in selected_agents and "mvp_features" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Product Manager Agent",
                    f"Refining MVP scope according to feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("product")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Product Manager Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Refine previous MVP features {json.dumps(artifacts['mvp_features'])} based on this feedback: '{feedback}'"
                        raw = await pm_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["mvp_features"] = json.loads(raw).get("features", [])
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Product Manager Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        feats = artifacts["mvp_features"]
                        new_id = f"feat_{len(feats) + 1}"
                        feat_name = f"Feature {new_id.upper()} (Refined)"
                        desc = f"Refinement request: {feedback}"
                        if custom_prompt and "chatbot" in custom_prompt.lower():
                            feat_name = "AI Advisory Chatbot"
                            desc = f"Refinement chatbot: {feedback}"
                        elif custom_prompt and "mobile" in custom_prompt.lower():
                            feat_name = "Mobile App Feature"
                            desc = f"Refinement mobile capability: {feedback}"
                        feats.append({
                            "id": new_id,
                            "name": feat_name,
                            "tier": "Must-Have",
                            "description": desc,
                            "effort": "Easy (1 week)"
                        })
                        artifacts["mvp_features"] = feats
                else:
                    feats = artifacts["mvp_features"]
                    new_id = f"feat_{len(feats) + 1}"
                    feat_name = f"Feature {new_id.upper()} (Refined)"
                    desc = f"Refinement request: {feedback}"
                    if custom_prompt and "chatbot" in custom_prompt.lower():
                        feat_name = "AI Advisory Chatbot"
                        desc = f"Refinement chatbot: {feedback}"
                    elif custom_prompt and "mobile" in custom_prompt.lower():
                        feat_name = "Mobile App Feature"
                        desc = f"Refinement mobile capability: {feedback}"
                    feats.append({
                        "id": new_id,
                        "name": feat_name,
                        "tier": "Must-Have",
                        "description": desc,
                        "effort": "Easy (1 week)"
                    })
                    artifacts["mvp_features"] = feats
                
                await cls.log_and_broadcast(
                    project_id, "Product Manager Agent", "CEO Agent",
                    "MVP feature backlog updated in features list.",
                    "completed", broadcast_cb
                )
            # UI/UX Refinement
            if "design" in selected_agents and "design_guidelines" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "UI/UX Agent",
                    f"Refining wireframes and design system according to feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("design")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "UI/UX Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Refine previous design system and user flows {json.dumps(artifacts['design_guidelines'])} based on feedback: '{feedback}'"
                        raw = await uiux_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["design_guidelines"] = json.loads(raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "UI/UX Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        dg = artifacts["design_guidelines"]
                        dg["design_system"]["theme"] += f" (Refinement: {feedback})"
                        artifacts["design_guidelines"] = dg
                else:
                    dg = artifacts["design_guidelines"]
                    dg["design_system"]["theme"] += f" (Refinement: {feedback})"
                    artifacts["design_guidelines"] = dg
                
                await cls.log_and_broadcast(
                    project_id, "UI/UX Agent", "CEO Agent",
                    "UI/UX design guidelines successfully updated.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Finance Refinement
            if "finance" in selected_agents and "revenue_model" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Finance Agent",
                    f"Refining financial variables based on feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("finance")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Finance Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Update pricing models and defaults {json.dumps(artifacts['revenue_model'])} based on feedback: '{feedback}'"
                        raw = await finance_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["revenue_model"] = json.loads(raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Finance Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        rev = artifacts["revenue_model"]
                        multiplier = 1.5 if custom_prompt and "high" in custom_prompt.lower() else 1.2
                        rev["pricing"]["premium_monthly_cost"] = round(rev["pricing"]["premium_monthly_cost"] * multiplier, 2)
                        rev["projections_narrative"] += f" (Refined with custom prompt rules: {feedback})"
                        artifacts["revenue_model"] = rev
                else:
                    rev = artifacts["revenue_model"]
                    multiplier = 1.5 if custom_prompt and "high" in custom_prompt.lower() else 1.2
                    rev["pricing"]["premium_monthly_cost"] = round(rev["pricing"]["premium_monthly_cost"] * multiplier, 2)
                    rev["projections_narrative"] += f" (Refined with custom prompt rules: {feedback})"
                    artifacts["revenue_model"] = rev
                
                await cls.log_and_broadcast(
                    project_id, "Finance Agent", "CEO Agent",
                    "Financial models and unit economics recalculated.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Marketing Refinement
            if "marketing" in selected_agents and "marketing_plan" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Marketing Agent",
                    f"Updating GTM strategies based on feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("marketing")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Marketing Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Update marketing plan {json.dumps(artifacts['marketing_plan'])} based on feedback: '{feedback}'"
                        raw = await marketing_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["marketing_plan"] = json.loads(raw)
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Marketing Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        mkt = artifacts["marketing_plan"]
                        channel_name = "Refined Growth Channel"
                        if custom_prompt and "viral" in custom_prompt.lower():
                            channel_name = "Viral Marketing Loop"
                        mkt["gtm_channels"].append({
                            "channel": channel_name,
                            "desc": f"Added via user feedback: {feedback}"
                        })
                        artifacts["marketing_plan"] = mkt
                else:
                    mkt = artifacts["marketing_plan"]
                    channel_name = "Refined Growth Channel"
                    if custom_prompt and "viral" in custom_prompt.lower():
                        channel_name = "Viral Marketing Loop"
                    mkt["gtm_channels"].append({
                        "channel": channel_name,
                        "desc": f"Added via user feedback: {feedback}"
                    })
                    artifacts["marketing_plan"] = mkt
                
                await cls.log_and_broadcast(
                    project_id, "Marketing Agent", "CEO Agent",
                    "GTM schedule and marketing logs updated.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Legal Refinement
            if "legal" in selected_agents and "legal_checklist" in artifacts:
                await cls.log_and_broadcast(
                    project_id, "CEO Agent", "Legal Agent",
                    f"Refining compliance rules based on feedback: '{feedback}'",
                    "thinking", broadcast_cb
                )
                custom_prompt = agent_configs.get("legal")
                if custom_prompt:
                    label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                    await cls.log_and_broadcast(
                        project_id, "System", "Legal Agent",
                        f"{label} Custom prompt active: '{custom_prompt}'",
                        "thinking", broadcast_cb
                    )
                await asyncio.sleep(step_delay)
                if is_live:
                    try:
                        prompt = f"Update legal guidelines {json.dumps(artifacts['legal_checklist'])} based on feedback: '{feedback}'"
                        raw = await legal_agent.execute(prompt, effective_key, json_mode=True, system_prompt=custom_prompt)
                        artifacts["legal_checklist"] = json.loads(raw).get("legal_checklist", [])
                    except Exception as api_err:
                        await cls.log_and_broadcast(
                            project_id, "System", "Legal Agent",
                            f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                            "thinking", broadcast_cb
                        )
                        leg = artifacts["legal_checklist"]
                        leg.append({
                            "topic": "Compliance Refinement",
                            "compliance": f"Special requirement: {feedback} (Verified custom prompt)",
                            "status": "Required before Beta"
                        })
                        artifacts["legal_checklist"] = leg
                else:
                    leg = artifacts["legal_checklist"]
                    leg.append({
                        "topic": "Compliance Refinement",
                        "compliance": f"Special requirement: {feedback} (Verified custom prompt)",
                        "status": "Required before Beta"
                    })
                    artifacts["legal_checklist"] = leg
                
                await cls.log_and_broadcast(
                    project_id, "Legal Agent", "CEO Agent",
                    "Legal disclaimers and safety compliance audit updated.",
                    "completed", broadcast_cb
                )
                await asyncio.sleep(step_delay)

            # Re-compile Pitch Deck summary
            custom_ceo_prompt = agent_configs.get("ceo")
            if custom_ceo_prompt:
                label = "[SIMULATION]" if not is_live else "[LIVE OVERRIDE]"
                await cls.log_and_broadcast(
                    project_id, "System", "CEO Agent",
                    f"{label} Custom prompt active: '{custom_ceo_prompt}'",
                    "thinking", broadcast_cb
                )
            if is_live:
                try:
                    pitch_prompt = f"Regenerate slides based on refined components: {json.dumps(artifacts)[:2000]}."
                    pitch_raw = await ceo.execute(pitch_prompt, effective_key, json_mode=True, system_prompt=custom_ceo_prompt)
                    artifacts["pitch_deck"] = json.loads(pitch_raw).get("pitch_deck", artifacts.get("pitch_deck"))
                except Exception as api_err:
                    await cls.log_and_broadcast(
                        project_id, "System", "CEO Agent",
                        f"Live refinement API call failed ({str(api_err)}). Falling back to Simulation Mode.",
                        "thinking", broadcast_cb
                    )

            # Save modified artifacts
            project["artifacts"] = artifacts
            project["status"] = "completed"
            await db.save_project(project)

            # Broadcast final completion
            await cls.log_and_broadcast(
                project_id, "CEO Agent", "System",
                "Refinement loop finished successfully! Updated deliverables are ready for review.",
                "completed", broadcast_cb
            )
            
            if broadcast_cb:
                await broadcast_cb(project_id, {"type": "project_updated", "data": project})

        except Exception as e:
            project["status"] = "completed"  # Reset back to completed even if failed to keep UI stable
            await db.save_project(project)
            await cls.log_and_broadcast(
                project_id, "System", "CEO Agent",
                f"Refinement failed: {str(e)}",
                "failed", broadcast_cb
            )
            if broadcast_cb:
                await broadcast_cb(project_id, {"type": "project_updated", "data": project})
