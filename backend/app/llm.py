import os
import httpx
import json
import random
from typing import Optional, Dict, Any

class GeminiClient:
    @staticmethod
    async def call_gemini(
        prompt: str,
        api_key: Optional[str] = None,
        model: str = "gemini-1.5-flash",
        temperature: float = 0.7,
        json_mode: bool = False
    ) -> str:
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API key is not configured.")

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature
            }
        }
        
        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=payload, timeout=45.0)
                if response.status_code != 200:
                    error_detail = response.text
                    try:
                        err_json = response.json()
                        error_detail = err_json.get("error", {}).get("message", response.text)
                    except:
                        pass
                    raise Exception(f"Gemini API Error ({response.status_code}): {error_detail}")
                
                res_data = response.json()
                candidate = res_data.get("candidates", [{}])[0]
                text = candidate.get("content", {}).get("parts", [{}])[0].get("text", "")
                return text.strip()
            except httpx.TimeoutException:
                raise Exception("Request to Gemini API timed out.")
            except Exception as e:
                raise Exception(f"Failed to communicate with Gemini API: {str(e)}")


class MockLLM:
    """
    Generates highly realistic startup materials dynamically based on the input prompt.
    Includes custom tailored templates for agricultural/farmer ideas to fit the user's specific request.
    """
    @staticmethod
    def generate_mock_data(idea: str) -> Dict[str, Any]:
        idea_lower = idea.lower()
        is_agri = any(k in idea_lower for k in ["farm", "agri", "crop", "soil", "harvest", "kisan", "plant"])
        
        # Determine startup name
        name = "AgriIntel" if is_agri else "SmartLaunch AI"
        if "build a startup around" in idea_lower:
            cleaned_idea = idea_lower.replace("build a startup around", "").strip()
            words = [w.capitalize() for w in cleaned_idea.split() if w]
            if words:
                name = "".join(words[:2]) + "AI"
        elif "build a startup for" in idea_lower:
            cleaned_idea = idea_lower.replace("build a startup for", "").strip()
            words = [w.capitalize() for w in cleaned_idea.split() if w]
            if words:
                name = "".join(words[:2]) + "Hub"
        
        # 1. Executive Summary
        exec_summary = (
            f"**{name}** is a revolutionary AI-powered platform designed to optimize operations for its target audience. "
            f"By addressing the core problem: '{idea}', our platform introduces autonomous multi-agent analysis, real-time "
            f"data integration, and predictive guidance. We empower our users to make data-driven decisions, streamline "
            f"complex workflows, and increase efficiency by up to 45% within the first six months of deployment."
        )

        # 2. Market Report
        if is_agri:
            market_report = {
                "market_size_tam": "$12.4 Billion (Global Smart Agriculture)",
                "market_size_sam": "$3.2 Billion (APAC & North America Precision Farming)",
                "market_size_som": "$180 Million (Targeting small-to-medium scale farmers in India & SEA)",
                "growth_rate_cagr": "14.2% annually (2025-2032)",
                "key_trends": [
                    "Precision agriculture using local soil and weather telemetry.",
                    "Mobile-first vernacular AI assistants for farmers without technical backgrounds.",
                    "Supply chain disintermediation (directly connecting growers to bulk buyers)."
                ],
                "target_demographics": "Farmers aged 28-55, agricultural cooperatives, and local crop distributors.",
                "market_barriers": "High initial tech skepticism, limited internet bandwidth in deep rural zones, fragmented land holdings."
            }
        else:
            market_report = {
                "market_size_tam": "$25.0 Billion (Global Target Sector)",
                "market_size_sam": "$5.8 Billion (Regional Digitzation)",
                "market_size_som": "$250 Million (Direct Servicable Launch Market)",
                "growth_rate_cagr": "11.8% annually",
                "key_trends": [
                    "Hyper-automation of manual business administration.",
                    "Personalized customer experiences powered by low-latency agent models.",
                    "Shift towards micro-SaaS and localized niche solutions."
                ],
                "target_demographics": "Freelancers, independent operators, and small-to-medium enterprises (SMEs).",
                "market_barriers": "High customer acquisition costs, established legacy software monopolies, integration friction."
            }

        # 3. Competitor Analysis
        if is_agri:
            competitors = [
                {"name": "CropIn", "strengths": "Established enterprise network, global contracts", "weaknesses": "Complex UI, expensive pricing for individual farmers, lacks conversational AI", "our_advantage": "Direct voice-controlled vernacular assistant, instant hyper-local advice"},
                {"name": "Farmsio", "strengths": "Good supply chain integration tools", "weaknesses": "Slow onboarding, requires manual data entries", "our_advantage": "Autonomous IoT and satellite photo scanning, zero-friction setup"},
                {"name": "KhetiGaadi", "strengths": "Strong tractor rental marketplace network", "weaknesses": "Lacks scientific predictive modeling", "our_advantage": "Predictive AI crop rotation and yield forecasting algorithms"}
            ]
        else:
            competitors = [
                {"name": "LegacyCorp", "strengths": "Deep pockets, massive brand awareness", "weaknesses": "Extremely slow product updates, rigid license contracts", "our_advantage": "Flexible usage-based pricing, deployment in minutes"},
                {"name": "FastSaaS", "strengths": "Very slick modern mobile app", "weaknesses": "No deeper AI reasoning or custom agent configurations", "our_advantage": "Multi-agent collaborative workflows custom to user business rules"},
                {"name": "Manual Excel Sheets", "strengths": "Free, familiar to all business owners", "weaknesses": "Zero automation, error-prone, doesn't scale", "our_advantage": "Complete hands-free database logging and automated reminders"}
            ]
        
        competitor_analysis = {
            "competitors": competitors,
            "swot_analysis": {
                "strengths": ["Proprietary lightweight AI models", "Conversational interface requiring zero training", "Highly scalable serverless backend architecture"],
                "weaknesses": ["Brand new market entry", "Requires initial seeding of trust", "Dependency on third-party cloud infrastructure"],
                "opportunities": ["Rapid smartphone adoption in target groups", "Government subsidies for digital modernization", "Strategic partnerships with local supply hubs"],
                "threats": ["Cloning of features by cash-rich incumbents", "Rapid fluctuations in data API pricing", "Regulatory privacy compliance changes"]
            }
        }

        # 4. MVP Features
        if is_agri:
            mvp_features = [
                {"id": "feat_1", "name": "Vernacular Audio Assistant", "tier": "Must-Have", "description": "Speak in regional languages (Hindi, Spanish, Telugu) to ask soil or crop questions, translating voice to text and querying AI CEO.", "effort": "Medium (3 weeks)"},
                {"id": "feat_2", "name": "Satellite Leaf Disease Scanner", "tier": "Must-Have", "description": "Upload a photo of a crop leaf; the image processing model detects pest infestations or nutrient deficiencies in 3 seconds.", "effort": "High (5 weeks)"},
                {"id": "feat_3", "name": "Hyperlocal Weather & Action Planner", "tier": "Should-Have", "description": "Fetches meteorological datasets to recommend irrigation plans, suggesting exact optimal watering hours.", "effort": "Easy (1 week)"},
                {"id": "feat_4", "name": "Direct B2B Market Link", "tier": "Nice-to-Have", "description": "List harvest yields to local pre-approved distributors, skipping traditional retail middle-men.", "effort": "High (6 weeks)"}
            ]
        else:
            mvp_features = [
                {"id": "feat_1", "name": "Core Autonomous Dashboard", "tier": "Must-Have", "description": "Visual feed showing real-time agent suggestions and metrics.", "effort": "Medium (2 weeks)"},
                {"id": "feat_2", "name": "Interactive Client Billing", "tier": "Must-Have", "description": "Generates and dispatches invoices automatically on project completion.", "effort": "Easy (1 week)"},
                {"id": "feat_3", "name": "Dynamic Analytics Tracker", "tier": "Should-Have", "description": "Pulls user engagement metrics and visualizes them on simple line charts.", "effort": "Medium (3 weeks)"},
                {"id": "feat_4", "name": "AI Content Writer for Socials", "tier": "Nice-to-Have", "description": "Drafts customized promotional captions for Twitter, LinkedIn, and Instagram.", "effort": "Easy (1 week)"}
            ]

        # 5. UI/UX Design Guidelines
        design_guidelines = {
            "design_system": {
                "color_palette": ["#090D16 (Deep Space)", "#10B981 (Emerald)", "#3B82F6 (Blue Glow)"] if is_agri else ["#0B0F19 (Navy)", "#6366F1 (Indigo)", "#64748B (Slate)"],
                "typography": "Plus Jakarta Sans for headers, Inter for clean body text.",
                "theme": "Premium Dark Mode with Glassmorphism cards and neon telemetry glows."
            },
            "user_flow": [
                {
                    "step": "1. Query Initiation",
                    "action": "Entrepreneur launches dashboard and details startup prompt instructions.",
                    "outcome": "Specialized agents are activated in a sequential pipeline to validate the business idea."
                },
                {
                    "step": "2. Workspace Review",
                    "action": "Entrepreneur views separate windows with reports and updates parameters in the calculator.",
                    "outcome": "Projections and timelines recalculate instantly."
                },
                {
                    "step": "3. Action Execution",
                    "action": "Entrepreneur follows the visual chronological roadmap to begin corporate setup and GTM actions.",
                    "outcome": "GTM checklists and progress trackers update state."
                }
            ],
            "wireframe_specification": {
                "header": "Clean glassmorphism navbar with project name, model selectors, and settings config icon.",
                "hero_section": "Multi-agent graph visualization showing active transmissions and critique links.",
                "core_feature_section": "Chronological timeline roadmap layout displaying validation reports, MVP roadmaps, and pricing models.",
                "call_to_action": "Central command input to dispatch instructions to the virtual executive team."
            }
        }


        # 6. Pitch Deck (10 slides)
        pitch_deck = [
            {"slide": "1", "title": f"Introducing {name}", "bullets": ["Autonomous Agentic Ecosystem for targeted industry solutions.", f"Addressing the prompt: '{idea}'.", "Bridging scientific reasoning with simple, accessible user controls."]},
            {"slide": "2", "title": "The Core Problem", "bullets": [f"Current systems lack real-time context-specific intelligence.", "Audience experiences critical bottlenecks and severe efficiency loss.", "Existing tech requires heavy user onboarding and manual configuration."]},
            {"slide": "3", "title": "Our AI CEO Solution", "bullets": ["Orchestrates 7 specialized agents (Product, Market, Finance, Legal, etc.)", "Runs verification loops to check market suitability vs MVP costs.", "Real-time refinement capability based on continuous stakeholder critique."]},
            {"slide": "4", "title": "Market Opportunity", "bullets": [f"TAM: {market_report.get('market_size_tam')}", f"SOM: {market_report.get('market_size_som')}", f"Highly promising growth rate of {market_report.get('growth_rate_cagr')}."]},
            {"slide": "5", "title": "Product MVP Specs", "bullets": [f"Phase 1: Launch {mvp_features[0]['name']} ({mvp_features[0]['tier']})", f"Phase 2: Integrate {mvp_features[1]['name']} ({mvp_features[1]['tier']})", "High-frequency analytics dashboard for end-to-end management."]},
            {"slide": "6", "title": "Competitive Edge", "bullets": ["First conversational agent network specifically customized to this niche.", "Zero-friction audio/image-telemetry pipelines.", "40% lower operational software cost compared to incumbents."]},
            {"slide": "7", "title": "Business & Pricing Model", "bullets": ["Tier 1: Free starter package (basic queries & scans).", "Tier 2: Growth tier ($19 - $49/mo based on usage).", "Tier 3: Enterprise custom portal configuration."]},
            {"slide": "8", "title": "Marketing & GTM Strategy", "bullets": ["Verifying market channels through local community groups.", "Collaborating with bulk distributors and strategic suppliers.", "Launching organic search optimizations targeting operational queries."]},
            {"slide": "9", "title": "Financial Projections", "bullets": ["Year 1 target: $150K ARR with 80% margins.", "Customer Acquisition Cost (CAC) estimated under $15.", "Month 6 target: Net-positive break-even operational phase."]},
            {"slide": "10", "title": "The Path Forward", "bullets": ["Finalize core agent refinement pipelines.", "Alpha group deployments starting in Q3.", "Seed investment round of $350K to scale API throughput."]}
        ]

        # 7. Marketing Plan
        marketing_plan = {
            "gtm_channels": [
                {"channel": "SEO & Content Marketing", "desc": "Write guides on solving user pain points, driving organic visits."},
                {"channel": "Community Outreach", "desc": "Partnerships with niche community groups, forums, and local co-ops."},
                {"channel": "Referral Programs", "desc": "Give discounts to current users for introducing neighbor businesses."}
            ],
            "timeline_90_days": [
                {"days": "1-30", "tasks": ["Launch landing page waitlist", "Seed local community forums", "Interview 25 target customers"]},
                {"days": "31-60", "tasks": ["Deploy private beta to 50 users", "Publish 10 educational blog posts", "Setup initial email newsletter"]},
                {"days": "61-90", "tasks": ["Launch public version", "Activate B2B ambassador program", "Scale organic search engine indexing"]}
            ]
        }

        # 8. Revenue Model (Calculations variables)
        revenue_model = {
            "pricing": {
                "free_tier_limit": "5 searches/mo",
                "premium_monthly_cost": 29.0,
                "enterprise_monthly_cost": 199.0
            },
            "calculator_defaults": {
                "monthly_visitors": 5000,
                "conversion_rate": 2.5,
                "churn_rate": 5.0,
                "premium_percentage": 90,
                "enterprise_percentage": 10
            },
            "projections_narrative": "At 5,000 monthly visitors converting at 2.5%, we add 125 new subscribers per month. With standard churn, year 1 ARR will exceed $50K with high margins."
        }

        # 9. Legal Checklist
        legal_checklist = [
            {"topic": "Data Protection", "compliance": "GDPR / CCPA data collection notice for user-submitted files and browser telemetry.", "status": "Required before Beta"},
            {"topic": "Terms of Service", "compliance": "Disclaimers stating that AI agent recommendations are for guidance and do not constitute certified legal/financial advisory.", "status": "Required at Launch"},
            {"topic": "Corporate Registry", "compliance": "Forming a limited liability entity (LLC or Private Limited) to protect founders from liability.", "status": "Target: Month 3"},
            {"topic": "Licensing Contracts", "compliance": "Creating structured terms for bulk agricultural distributors or enterprise users.", "status": "Target: Month 6"}
        ]

        return {
            "name": name,
            "exec_summary": exec_summary,
            "market_report": market_report,
            "competitor_analysis": competitor_analysis,
            "mvp_features": mvp_features,
            "design_guidelines": design_guidelines,
            "pitch_deck": pitch_deck,
            "marketing_plan": marketing_plan,
            "revenue_model": revenue_model,
            "legal_checklist": legal_checklist
        }
