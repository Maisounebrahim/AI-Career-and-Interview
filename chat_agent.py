"""
AI Career Coach - Chat Agent
Gemini function-calling agent with tool routing to existing backend functions.
All tool execution is server-side with an explicit allowlist.
"""
import json
import re
import uuid
import ai_service
from ai_service import _effective_model, _resolve_lang


def _get_cached_client():
    """Return an AI client via ai_service.get_ai_client()."""
    return ai_service.get_ai_client()


def _extract_cv_from_messages(messages: list) -> str:
    """Extract attached or pasted CV text from conversation messages if present."""
    if not messages:
        return ""
    # 1. Look for explicit [Attached CV: ...] blocks from most recent to oldest
    for m in reversed(messages):
        if m.get("role") != "user":
            continue
        content = m.get("content") or ""
        if "[Attached CV:" in content:
            idx = content.find("[Attached CV:")
            newline_idx = content.find("\n", idx)
            if newline_idx != -1:
                cv_part = content[newline_idx + 1:].strip()
                if len(cv_part) > 40:
                    return cv_part
    # 2. Otherwise look for a long user message (>300 chars) that looks like a CV
    for m in reversed(messages):
        if m.get("role") != "user":
            continue
        content = (m.get("content") or "").strip()
        if len(content) > 300:
            return content
    return ""


def _extract_last_session_context(messages: list) -> dict:
    """Extract the most recent interview session_id, qa_id, and question from history."""
    if not messages:
        return {}
    for m in reversed(messages):
        content = m.get("content") or ""
        # Check embedded [Tool Context: ...] markers added by app._build_agent_history
        match = re.search(r"\[Interview Session Context:\s*(\{.*?\})\]", content)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
    return {}


# ── Tool definitions sent to Gemini ──────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "evaluate_cv",
            "description": "Evaluate a CV and return a structured report with scores, strengths, weaknesses, and improvements. Call when the user wants their CV evaluated or reviewed. If the user already attached or pasted their CV in the chat, pass 'ATTACHED_CV' for cv_text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cv_text": {"type": "string", "description": "Full plain-text content of the CV to evaluate, OR 'ATTACHED_CV' if the CV was already attached/pasted in the conversation"},
                    "language": {"type": "string", "enum": ["en", "ar"], "description": "Response language"}
                },
                "required": ["cv_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "optimize_cv",
            "description": "Analyze a CV and produce phrasing improvement suggestions (original vs suggested, with reasoning). Never fabricates experience. If the user already attached or pasted their CV in the chat, pass 'ATTACHED_CV' for cv_text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cv_text":     {"type": "string", "description": "Full CV text to optimize, OR 'ATTACHED_CV' if already attached/pasted in the conversation"},
                    "target_role": {"type": "string", "description": "Optional target job title"},
                    "language":    {"type": "string", "enum": ["en", "ar"]}
                },
                "required": ["cv_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_cv",
            "description": "Create and save a new CV from structured user information. Use when the user wants to build a CV from scratch and has provided their details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name":           {"type": "string"},
                    "email":          {"type": "string"},
                    "phone":          {"type": "string"},
                    "location":       {"type": "string"},
                    "linkedin":       {"type": "string"},
                    "target_role":    {"type": "string", "description": "Target job title or role"},
                    "summary":        {"type": "string", "description": "Professional summary paragraph"},
                    "experience":     {"type": "array", "description": "List of work experience objects",
                                       "items": {"type": "object"}},
                    "education":      {"type": "array", "description": "List of education objects",
                                       "items": {"type": "object"}},
                    "projects":       {"type": "array", "description": "List of project objects",
                                       "items": {"type": "object"}},
                    "skills":         {"type": "array", "items": {"type": "string"}},
                    "certifications": {"type": "array", "items": {"type": "string"}},
                    "achievements":   {"type": "array", "items": {"type": "string"}},
                    "language":       {"type": "string", "enum": ["en", "ar"]}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "match_job",
            "description": "Compare a CV against a job description. Identifies matching qualifications, gaps, and missing ATS keywords. Pass 'ATTACHED_CV' for cv_text if the CV was already attached in the conversation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cv_text":         {"type": "string", "description": "Full CV text, OR 'ATTACHED_CV' if already attached in the conversation"},
                    "job_description": {"type": "string", "description": "Full job posting text"},
                    "language":        {"type": "string", "enum": ["en", "ar"]}
                },
                "required": ["cv_text", "job_description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "start_interview",
            "description": "Start an interactive mock interview session. Returns the session ID and the first question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_role":    {"type": "string"},
                    "industry":       {"type": "string"},
                    "interview_type": {"type": "string",
                                       "enum": ["behavioral", "technical", "hr", "situational", "mixed"]},
                    "difficulty":     {"type": "string", "enum": ["entry", "medium", "hard"]},
                    "language":       {"type": "string", "enum": ["en", "ar"]}
                },
                "required": ["target_role"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "submit_interview_answer",
            "description": "Submit a user's answer to the current interview question and receive evaluation + next question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "integer", "description": "Active interview session ID"},
                    "qa_id":      {"type": "integer", "description": "ID of the current question record"},
                    "question":   {"type": "string", "description": "The interview question being answered"},
                    "answer":     {"type": "string", "description": "The user's answer to evaluate"}
                },
                "required": ["answer"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "end_interview",
            "description": "End the active mock interview session and generate a final performance report and practice plan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {"type": "integer", "description": "Active interview session ID"},
                    "language":   {"type": "string", "enum": ["en", "ar"]}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_rejection",
            "description": "Analyze a job rejection scenario. Distinguishes facts from hypotheses and produces an actionable recovery plan.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_title":           {"type": "string"},
                    "company":             {"type": "string"},
                    "application_details": {"type": "string"},
                    "feedback_received":   {"type": "string"},
                    "language":            {"type": "string", "enum": ["en", "ar"]}
                },
                "required": ["job_title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "review_offer",
            "description": "Analyze a job offer: summarize terms, identify risks, suggest questions, and draft a negotiation message.",
            "parameters": {
                "type": "object",
                "properties": {
                    "offer_details":   {"type": "string", "description": "Full offer text (salary, equity, benefits, clauses…)"},
                    "user_priorities": {"type": "string", "description": "What the user cares most about"},
                    "job_title":       {"type": "string"},
                    "company":         {"type": "string"},
                    "language":        {"type": "string", "enum": ["en", "ar"]}
                },
                "required": ["offer_details"]
            }
        }
    }
]


# ── Allowlisted tool executor ─────────────────────────────────────────────────

def execute_tool(tool_name: str, args: dict, context_messages: list = None) -> dict:
    """Execute a tool by name against the existing backend functions.
    Only functions in this explicit allowlist can be invoked.
    """
    from ai_service import (
        ai_evaluate_cv, ai_optimize_cv, ai_match_job,
        ai_analyze_rejection, ai_review_offer,
        ai_interview_question, ai_evaluate_answer, ai_interview_report
    )
    from database import (
        save_cv, save_evaluation, save_interview_session,
        save_interview_qa, get_interview_session, list_interview_sessions,
        save_rejection_analysis, save_offer_review,
        save_optimization_suggestions
    )

    args = args or {}
    last_user_text = ""
    if context_messages:
        for m in reversed(context_messages):
            if m.get("role") == "user":
                last_user_text = m.get("content", "")
                break

    def _get_resolved_cv(raw_cv: str) -> str:
        raw_cv = (raw_cv or "").strip()
        extracted = _extract_cv_from_messages(context_messages) if context_messages else ""
        if raw_cv.upper() in ("ATTACHED_CV", "USE_ATTACHED_CV", "CONVERSATION_CV") and extracted:
            return extracted
        if not raw_cv and extracted:
            return extracted
        if extracted and len(raw_cv) < 120 and len(extracted) > len(raw_cv):
            return extracted
        return raw_cv

    # ── 1. evaluate_cv ────────────────────────────────────────────────────────
    if tool_name == "evaluate_cv":
        cv_text  = _get_resolved_cv(args.get("cv_text", ""))
        language = _resolve_lang(args.get("language"), last_user_text)
        if not cv_text:
            return {"error": "cv_text is required"}
        result = ai_evaluate_cv(cv_text, language)
        if result.get("success") and result.get("data"):
            eval_id = save_evaluation({
                "evaluation_type": "general",
                "input_text": cv_text[:5000],
                "results": result["data"]
            })
            result["evaluation_id"] = eval_id
        return result

    # ── 2. optimize_cv ────────────────────────────────────────────────────────
    elif tool_name == "optimize_cv":
        cv_text     = _get_resolved_cv(args.get("cv_text", ""))
        target_role = args.get("target_role", "")
        language    = _resolve_lang(args.get("language"), last_user_text)
        if not cv_text:
            return {"error": "cv_text is required"}
        result = ai_optimize_cv(cv_text, language, target_role=target_role)
        if result.get("success") and result.get("data"):
            session_id = uuid.uuid4().hex
            suggestions = result["data"].get("suggestions", [])
            if suggestions:
                saved_sugs = save_optimization_suggestions(session_id, None, suggestions)
                result["data"]["suggestions"] = saved_sugs
            result["session_id"] = session_id
            result["original_cv_text"] = cv_text
        return result

    # ── 3. create_cv ──────────────────────────────────────────────────────────
    elif tool_name == "create_cv":
        contact = {
            "name":     args.get("name", ""),
            "email":    args.get("email", ""),
            "phone":    args.get("phone", ""),
            "location": args.get("location", ""),
            "linkedin": args.get("linkedin", "")
        }
        sections = []
        if args.get("experience"):
            exp = args["experience"]
            items = exp if isinstance(exp, list) else [str(exp)]
            sections.append({"title": "Experience", "type": "experience", "items": items})
        if args.get("education"):
            edu = args["education"]
            items = edu if isinstance(edu, list) else [str(edu)]
            sections.append({"title": "Education", "type": "education", "items": items})
        if args.get("projects"):
            proj = args["projects"]
            items = proj if isinstance(proj, list) else [str(proj)]
            sections.append({"title": "Projects", "type": "projects", "items": items})
        if args.get("skills"):
            sk = args["skills"]
            items = sk if isinstance(sk, list) else [s.strip() for s in str(sk).split(",") if s.strip()]
            sections.append({"title": "Skills", "type": "skills", "items": items})
        if args.get("certifications"):
            cert = args["certifications"]
            items = cert if isinstance(cert, list) else [str(cert)]
            sections.append({"title": "Certifications", "type": "certifications", "items": items})
        if args.get("achievements"):
            ach = args["achievements"]
            items = ach if isinstance(ach, list) else [str(ach)]
            sections.append({"title": "Achievements", "type": "achievements", "items": items})

        lang = _resolve_lang(args.get("language"), last_user_text)
        name_str = args.get("name") or "My"
        role_str = args.get("target_role", "")
        title_str = f"{name_str} CV" + (f" – {role_str}" if role_str else "")
        cv_data = {
            "title":                title_str,
            "language":             lang,
            "contact_info":         contact,
            "professional_summary": args.get("summary", ""),
            "sections":             sections,
            "template":             "professional",
            "status":               "draft"
        }
        cv_id = save_cv(cv_data)
        return {
            "success": True,
            "cv_id":   cv_id,
            "cv_data": cv_data,
            "message": f"CV created and saved (ID {cv_id}). You can preview, edit, and export it as PDF or DOCX from the Create CV page."
        }

    # ── 4. match_job ──────────────────────────────────────────────────────────
    elif tool_name == "match_job":
        cv_text  = _get_resolved_cv(args.get("cv_text", ""))
        job_desc = args.get("job_description", "")
        language = _resolve_lang(args.get("language"), last_user_text)
        if not cv_text or not job_desc:
            return {"error": "Both cv_text and job_description are required"}
        result = ai_match_job(cv_text, job_desc, language)
        if result.get("success") and result.get("data"):
            eval_id = save_evaluation({
                "evaluation_type": "job_match",
                "input_text":      cv_text[:5000],
                "job_description": job_desc[:5000],
                "results":         result["data"]
            })
            result["evaluation_id"] = eval_id
        return result

    # ── 5. start_interview ────────────────────────────────────────────────────
    elif tool_name == "start_interview":
        lang = _resolve_lang(args.get("language"), last_user_text)
        session_id = save_interview_session({
            "target_role":    args.get("target_role", ""),
            "industry":       args.get("industry", ""),
            "interview_type": args.get("interview_type", "behavioral"),
            "difficulty":     args.get("difficulty", "medium"),
            "language":       lang,
            "status":         "active"
        })
        context = {
            "role":               args.get("target_role", ""),
            "industry":           args.get("industry", ""),
            "type":               args.get("interview_type", "behavioral"),
            "difficulty":         args.get("difficulty", "medium"),
            "language":           lang,
            "question_number":    1,
            "previous_questions": []
        }
        q_result = ai_interview_question(context)
        qa_id = None
        question_text = ""
        if q_result.get("success") and q_result.get("data"):
            question_text = q_result["data"].get("question", "")
            qa_id = save_interview_qa({
                "session_id":      session_id,
                "question_number": 1,
                "question":        question_text
            })
        return {
            "success":         True,
            "session_id":      session_id,
            "qa_id":           qa_id,
            "question":        question_text,
            "question_number": 1,
            "interview_type":  args.get("interview_type", "behavioral"),
            "tip":             q_result.get("data", {}).get("tip", "") if q_result.get("data") else ""
        }

    # ── 6. submit_interview_answer ────────────────────────────────────────────
    elif tool_name == "submit_interview_answer":
        hist_ctx   = _extract_last_session_context(context_messages)
        session_id = args.get("session_id") or hist_ctx.get("session_id")
        qa_id      = args.get("qa_id") or hist_ctx.get("qa_id")
        question   = args.get("question", "") or hist_ctx.get("question", "")
        answer     = args.get("answer", "")

        session = get_interview_session(session_id) if session_id else None
        if not session:
            # Fallback to most recent active interview session if available
            sessions = list_interview_sessions()
            active = [s for s in sessions if s.get("status") == "active"]
            if active:
                session_id = active[0]["id"]
                session = get_interview_session(session_id)

        if not session:
            return {"error": "Interview session not found"}

        questions_list = session.get("questions", [])
        if questions_list:
            last_q = questions_list[-1]
            if not qa_id:
                qa_id = last_q.get("id")
            if not question:
                question = last_q.get("question", "")

        context = {
            "role":     session.get("target_role", ""),
            "type":     session.get("interview_type", "behavioral"),
            "language": _resolve_lang(session.get("language", "en"), answer)
        }
        eval_result = ai_evaluate_answer(question, answer, context)
        if eval_result.get("success") and eval_result.get("data") and qa_id:
            save_interview_qa({
                "id":             qa_id,
                "user_answer":    answer,
                "evaluation":     eval_result["data"],
                "example_answer": eval_result["data"].get("example_answer", "")
            })

        # Fetch next question
        prev_qs = [q.get("question", "") for q in questions_list]
        if question and question not in prev_qs:
            prev_qs.append(question)
        next_num = len(prev_qs) + 1
        next_context = {
            "role":               session.get("target_role", ""),
            "industry":           session.get("industry", ""),
            "type":               session.get("interview_type", "behavioral"),
            "difficulty":         session.get("difficulty", "medium"),
            "language":           context["language"],
            "question_number":    next_num,
            "previous_questions": prev_qs
        }
        next_q_result = ai_interview_question(next_context)
        next_question = ""
        next_qa_id = None
        if next_q_result.get("success") and next_q_result.get("data"):
            next_question = next_q_result["data"].get("question", "")
            next_qa_id = save_interview_qa({
                "session_id":      session_id,
                "question_number": next_num,
                "question":        next_question
            })

        return {
            "success":           True,
            "session_id":        session_id,
            "evaluation":        eval_result.get("data", {}),
            "next_question":     next_question,
            "next_qa_id":        next_qa_id,
            "next_question_num": next_num,
            "next_tip":          next_q_result.get("data", {}).get("tip", "") if next_q_result.get("data") else ""
        }

    # ── 7. end_interview ──────────────────────────────────────────────────────
    elif tool_name == "end_interview":
        hist_ctx   = _extract_last_session_context(context_messages)
        session_id = args.get("session_id") or hist_ctx.get("session_id")
        session    = get_interview_session(session_id) if session_id else None
        if not session:
            sessions = list_interview_sessions()
            if sessions:
                session_id = sessions[0]["id"]
                session = get_interview_session(session_id)
        if not session:
            return {"error": "Interview session not found"}

        save_interview_session({**session, "id": session_id, "status": "completed"})
        lang = _resolve_lang(args.get("language") or session.get("language"), last_user_text)
        rep = ai_interview_report(session, language=lang)
        rep["session_id"] = session_id
        return rep

    # ── 8. analyze_rejection ──────────────────────────────────────────────────
    elif tool_name == "analyze_rejection":
        details = {
            "job_title":           args.get("job_title", ""),
            "company":             args.get("company", ""),
            "application_details": args.get("application_details", ""),
            "feedback_received":   args.get("feedback_received", "")
        }
        lang = _resolve_lang(args.get("language"), last_user_text)
        result = ai_analyze_rejection(details, language=lang)
        if result.get("success") and result.get("data"):
            analysis_id = save_rejection_analysis({
                **details,
                "analysis":         result["data"].get("analysis", {}),
                "improvement_plan": result["data"].get("improvement_plan", {})
            })
            result["analysis_id"] = analysis_id
        return result

    # ── 9. review_offer ───────────────────────────────────────────────────────
    elif tool_name == "review_offer":
        offer_details = args.get("offer_details", "")
        priorities    = args.get("user_priorities", "")
        if not offer_details:
            return {"error": "offer_details is required"}
        lang = _resolve_lang(args.get("language"), f"{offer_details} {last_user_text}")
        result = ai_review_offer(offer_details, priorities, language=lang)
        if result.get("success") and result.get("data"):
            review_id = save_offer_review({
                "job_title":       args.get("job_title", ""),
                "company":         args.get("company", ""),
                "offer_details":   offer_details,
                "user_priorities": priorities,
                "analysis":        result["data"]
            })
            result["review_id"] = review_id
        return result

    else:
        return {"error": f"Unknown tool: {tool_name}"}


# ── Main agent loop ───────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI Career Coach. Reply in the SAME language the user uses (Arabic or English).

Services you provide (you MUST invoke the matching tool function when the user wants a service executed and required inputs are present):
1. create_cv – build and save a CV from user facts (only after collecting name and actual background details)
2. optimize_cv – analyze and improve CV phrasing (pass cv_text='ATTACHED_CV' if a CV is already attached/pasted in the conversation)
3. evaluate_cv – score and critique a CV (pass cv_text='ATTACHED_CV' if a CV is already attached/pasted in the conversation)
4. match_job – compare a CV against a specific job description (pass cv_text='ATTACHED_CV' if a CV is already attached/pasted)
5. start_interview / submit_interview_answer / end_interview – conduct an interactive mock interview one question at a time
6. analyze_rejection – analyze a job rejection & build an evidence-based recovery plan
7. review_offer – analyze a job offer, identify concerns, and draft negotiation strategy

Mandatory Rules:
- Ask focused follow-up questions BEFORE calling any tool if essential information is missing (e.g., if the user wants CV creation without providing their education/skills/experience, or CV evaluation/optimization without providing a CV, or job matching without a job description, or offer review without offer details).
- When the user HAS provided a CV (such as `[Attached CV: ...]` or pasted CV text) and asks to evaluate or optimize it, you MUST call `evaluate_cv` or `optimize_cv` immediately (using `cv_text='ATTACHED_CV'`).
- When the user describes a job rejection with the role or interview/application context, you MUST call `analyze_rejection`.
- When the user provides job offer details (such as salary, role, or terms) and asks to review or negotiate it, you MUST call `review_offer`.
- NEVER pretend to have executed a tool in plain text without actually invoking the tool call.
- Do not write internal function names like `evaluate_cv` or `optimize_cv` in your user-facing text.
- Never fabricate qualifications, employment history, degrees, metrics, or live job search results. If asked to search live job listings, clarify that you do not search external job boards and offer to match their CV against any job description they paste.
- Keep conversation context; use the active `session_id` and `qa_id` when evaluating mock interview answers.
- After tool execution, provide a concise, helpful 2-4 sentence coaching summary in the user's language.
"""


def _extract_valid_tool_calls(msg):
    """Extract a list of normalized tool calls from an OpenAI/Gemini message or test mock."""
    raw_tcs = getattr(msg, "tool_calls", None)
    if isinstance(raw_tcs, (list, tuple)) and len(raw_tcs) > 0:
        return list(raw_tcs)

    # Support legacy function_call dict (e.g., in unit test mocks)
    fn_call = getattr(msg, "function_call", None)
    if isinstance(fn_call, dict) and fn_call.get("name"):
        class _LegacyFunc:
            def __init__(self, name, arguments):
                self.name = name
                self.arguments = arguments if isinstance(arguments, str) else json.dumps(arguments or {})
        class _LegacyTC:
            def __init__(self, fc):
                self.id = "call_legacy_1"
                self.type = "function"
                self.function = _LegacyFunc(fc.get("name"), fc.get("arguments", "{}"))
        return [_LegacyTC(fn_call)]

    return []


def _detect_missed_cv_tool(messages: list) -> tuple:
    """If the user provided sufficient service inputs and explicitly requested a service,
    return (tool_name, args) as a fallback if the model skipped the tool call."""
    last_user = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user = (m.get("content") or "").strip()
            break
    if not last_user:
        return None, None

    lower_user = last_user.lower()
    lang = _resolve_lang(None, last_user[:300])

    # 1. Check CV evaluate / optimize when CV is present
    cv_text = _extract_cv_from_messages(messages)
    if cv_text and len(cv_text) >= 80:
        intent_part = lower_user
        if "[attached cv:" in intent_part:
            intent_part = intent_part.split("[attached cv:")[0]
        elif len(intent_part) > 400:
            intent_part = intent_part[:300]

        eval_keywords = ("قيم", "قيّم", "تقييم", "evaluate", "review my cv", "score my cv", "assess my cv")
        opt_keywords  = ("حسن", "حسّن", "تحسين", " صياغ", "optimize", "improve my cv", "rewrite my cv")

        if any(k in intent_part for k in opt_keywords):
            return "optimize_cv", {"cv_text": "ATTACHED_CV", "language": lang}
        if any(k in intent_part for k in eval_keywords):
            return "evaluate_cv", {"cv_text": "ATTACHED_CV", "language": lang}

    # 2. Check Rejection Analysis when user provides rejection context (>= 60 chars)
    rej_keywords = ("اترفضت", "تم رفضي", "رفض طلبي", "rejected", "rejection")
    if len(last_user) >= 60 and any(k in lower_user for k in rej_keywords):
        return "analyze_rejection", {
            "job_title": "Target Role",
            "application_details": last_user,
            "language": lang
        }

    # 3. Check Offer Review when user provides offer details (>= 60 chars)
    offer_keywords = ("عرض عمل", "عرض وظيفي", "job offer", "offer letter")
    if len(last_user) >= 60 and any(k in lower_user for k in offer_keywords):
        return "review_offer", {
            "offer_details": last_user,
            "language": lang
        }

    return None, None


def _create_completion_with_retry(client, **kwargs):
    """Call client.chat.completions.create with automatic retry on 429 rate limits."""
    import time
    last_err = None
    for attempt in range(3):
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as e:
            last_err = e
            if "429" in str(e) and attempt < 2:
                time.sleep(4 * (attempt + 1))
                continue
            raise last_err


def run_agent(messages: list, max_rounds: int = 4) -> dict:
    """Run the agent loop with tool-calling.
    
    Args:
        messages: conversation history (list of {role, content})
        max_rounds: max tool-call cycles before returning
    
    Returns:
        dict with 'reply' (str), 'tool_calls' (list of executed tools),
        'tool_results' (list of raw results)
    """
    client = _get_cached_client()
    if not client:
        return {
            "reply": "⚠️ AI service is unavailable. Please configure AI_API_KEY in .env.local and check your connection.",
            "tool_calls": [],
            "tool_results": []
        }

    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    executed_tools = []
    tool_results   = []

    for _round in range(max_rounds):
        try:
            response = _create_completion_with_retry(
                client,
                model       = _effective_model(),
                messages    = full_messages,
                tools       = TOOL_DEFINITIONS,
                tool_choice = "auto",
                temperature = 0.5,
                max_tokens  = 2500,
                timeout     = 60
            )
        except Exception as e:
            err_str = str(e)
            if not executed_tools:
                missed_tool, missed_args = _detect_missed_cv_tool(messages)
                if missed_tool:
                    t_res = execute_tool(missed_tool, missed_args, context_messages=messages)
                    executed_tools.append({"name": missed_tool, "args": missed_args})
                    tool_results.append({"name": missed_tool, "result": t_res})
            if "400" in err_str:
                try:
                    response = _create_completion_with_retry(
                        client,
                        model       = _effective_model(),
                        messages    = full_messages,
                        temperature = 0.5,
                        max_tokens  = 2000,
                        timeout     = 60
                    )
                    return {
                        "reply":        response.choices[0].message.content or "",
                        "tool_calls":   executed_tools,
                        "tool_results": tool_results
                    }
                except Exception as e2:
                    return {
                        "reply": f"⚠️ AI request failed: {str(e2)}",
                        "tool_calls": executed_tools,
                        "tool_results": tool_results
                    }
            return {
                "reply": f"⚠️ AI request failed: {err_str}",
                "tool_calls": executed_tools,
                "tool_results": tool_results
            }

        msg = response.choices[0].message
        valid_tcs = _extract_valid_tool_calls(msg)

        # ── Pure text reply ────────────────────────────────────────────────
        if not valid_tcs:
            if not executed_tools:
                missed_tool, missed_args = _detect_missed_cv_tool(messages)
                if missed_tool:
                    t_res = execute_tool(missed_tool, missed_args, context_messages=messages)
                    executed_tools.append({"name": missed_tool, "args": missed_args})
                    tool_results.append({"name": missed_tool, "result": t_res})
            return {
                "reply":        msg.content or "",
                "tool_calls":   executed_tools,
                "tool_results": tool_results
            }

        # ── Tool call(s) requested ─────────────────────────────────────────
        if isinstance(getattr(msg, "tool_calls", None), (list, tuple)) and msg.tool_calls:
            full_messages.append(msg)
        else:
            full_messages.append({
                "role":       "assistant",
                "content":    getattr(msg, "content", "") or "",
                "tool_calls": [
                    {
                        "id":       getattr(tc, "id", str(i)),
                        "type":     "function",
                        "function": {
                            "name":      tc.function.name if hasattr(tc, "function") else tc.get("name"),
                            "arguments": tc.function.arguments if hasattr(tc, "function") else tc.get("arguments", "{}")
                        }
                    }
                    for i, tc in enumerate(valid_tcs)
                ]
            })

        # Execute each tool and append results
        for tc in valid_tcs:
            tool_name = tc.function.name if hasattr(tc, "function") else tc.get("name")
            args_raw  = tc.function.arguments if hasattr(tc, "function") else tc.get("arguments", "{}")
            try:
                args = json.loads(args_raw) if isinstance(args_raw, str) else (args_raw or {})
            except Exception:
                args = {}

            result = execute_tool(tool_name, args, context_messages=messages)
            executed_tools.append({"name": tool_name, "args": args})
            tool_results.append({"name": tool_name, "result": result})

            full_messages.append({
                "role":         "tool",
                "tool_call_id": getattr(tc, "id", "call_default"),
                "content":      json.dumps(result, ensure_ascii=False)
            })

        # If legacy function_call mock was used in unit tests, return after executing tool
        if not isinstance(getattr(msg, "tool_calls", None), (list, tuple)):
            return {
                "reply":        msg.content or "",
                "tool_calls":   executed_tools,
                "tool_results": tool_results
            }

    # Exceeded max rounds – ask Gemini to summarise what happened
    try:
        final = client.chat.completions.create(
            model       = _effective_model(),
            messages    = full_messages,
            temperature = 0.5,
            max_tokens  = 1000,
            timeout     = 60
        )
        return {
            "reply":        final.choices[0].message.content or "",
            "tool_calls":   executed_tools,
            "tool_results": tool_results
        }
    except Exception:
        return {
            "reply":        f"Completed {len(executed_tools)} operations. See results below.",
            "tool_calls":   executed_tools,
            "tool_results": tool_results
        }


# ── Streaming agent (yields SSE / NDJSON lines) ──────────────────────────────

def stream_agent(messages: list):
    """Streaming version of run_agent.

    Yields newline-delimited JSON strings (one per line):
      {"type":"thinking"}                          – tool execution in progress
      {"type":"tool","name":"...","result":{...}}  – tool result card
      {"type":"token","text":"..."}                – streamed text chunk
      {"type":"done","tool_calls":[...],"tool_results":[...]}
      {"type":"error","text":"..."}                – error
    """
    client = _get_cached_client()
    if not client:
        yield json.dumps({"type": "error", "text": "AI service unavailable. Please configure AI_API_KEY in .env.local."}) + "\n"
        return

    full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages
    executed_tools = []
    tool_results_list = []

    last_user_text = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            last_user_text = m.get("content", "")
            break
    is_ar = _resolve_lang(None, last_user_text[:300]) == "ar"

    # ── Phase 1: check for tool calls (non-streaming, generous max_tokens) ───
    try:
        check = _create_completion_with_retry(
            client,
            model       = _effective_model(),
            messages    = full_messages,
            tools       = TOOL_DEFINITIONS,
            tool_choice = "auto",
            temperature = 0.5,
            max_tokens  = 2500,
            timeout     = 60
        )
        msg = check.choices[0].message
        valid_tcs = _extract_valid_tool_calls(msg)

        if valid_tcs:
            yield json.dumps({"type": "thinking"}) + "\n"

            if isinstance(getattr(msg, "tool_calls", None), (list, tuple)) and msg.tool_calls:
                full_messages.append(msg)
            else:
                full_messages.append({
                    "role":    "assistant",
                    "content": getattr(msg, "content", "") or "",
                    "tool_calls": [
                        {
                            "id":       getattr(tc, "id", str(i)),
                            "type":     "function",
                            "function": {
                                "name":      tc.function.name if hasattr(tc, "function") else tc.get("name"),
                                "arguments": tc.function.arguments if hasattr(tc, "function") else tc.get("arguments", "{}")
                            }
                        }
                        for i, tc in enumerate(valid_tcs)
                    ]
                })

            for tc in valid_tcs:
                tool_name = tc.function.name if hasattr(tc, "function") else tc.get("name")
                args_str  = tc.function.arguments if hasattr(tc, "function") else tc.get("arguments", "{}")
                try:
                    args = json.loads(args_str) if isinstance(args_str, str) else (args_str or {})
                except Exception:
                    args = {}

                result = execute_tool(tool_name, args, context_messages=messages)
                executed_tools.append({"name": tool_name, "args": args})
                tool_results_list.append({"name": tool_name, "result": result})

                yield json.dumps(
                    {"type": "tool", "name": tool_name, "result": result},
                    ensure_ascii=False
                ) + "\n"

                tool_id = getattr(tc, "id", "call_default")
                full_messages.append({
                    "role":         "tool",
                    "tool_call_id": tool_id,
                    "content":      json.dumps(result, ensure_ascii=False)
                })

        else:
            # Check if the user attached a CV and explicitly asked for evaluate/optimize
            missed_tool, missed_args = _detect_missed_cv_tool(messages)
            if missed_tool:
                yield json.dumps({"type": "thinking"}) + "\n"
                result = execute_tool(missed_tool, missed_args, context_messages=messages)
                executed_tools.append({"name": missed_tool, "args": missed_args})
                tool_results_list.append({"name": missed_tool, "result": result})
                yield json.dumps(
                    {"type": "tool", "name": missed_tool, "result": result},
                    ensure_ascii=False
                ) + "\n"

            content = msg.content or ""
            if content:
                chunk_size = 40
                for i in range(0, len(content), chunk_size):
                    yield json.dumps(
                        {"type": "token", "text": content[i:i+chunk_size]},
                        ensure_ascii=False
                    ) + "\n"
                yield json.dumps({
                    "type": "done", "tool_calls": executed_tools, "tool_results": tool_results_list
                }, ensure_ascii=False) + "\n"
                return

    except Exception as e:
        err = str(e)
        if "400" not in err:
            yield json.dumps({"type": "error", "text": err}) + "\n"
            return

    # ── Phase 2: stream the final text answer (after tool execution) ─────────
    fallback_msg = (
        "تم تنفيذ الطلب بنجاح، ويمكنك مراجعة كافة النتائج بالتفصيل في البطاقة أدناه."
        if is_ar else
        "Analysis complete. You can review the detailed results in the card below."
    )
    try:
        stream = client.chat.completions.create(
            model       = _effective_model(),
            messages    = full_messages,
            temperature = 0.5,
            max_tokens  = 1500,
            timeout     = 60,
            stream      = True
        )
        token_emitted = False
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                token_emitted = True
                yield json.dumps(
                    {"type": "token", "text": delta.content},
                    ensure_ascii=False
                ) + "\n"

        if not token_emitted and tool_results_list:
            yield json.dumps({"type": "token", "text": fallback_msg}, ensure_ascii=False) + "\n"

    except Exception as e:
        if tool_results_list:
            yield json.dumps({
                "type": "token",
                "text": fallback_msg
            }, ensure_ascii=False) + "\n"
        else:
            yield json.dumps({"type": "error", "text": str(e)}) + "\n"
        yield json.dumps({
            "type": "done",
            "tool_calls": executed_tools,
            "tool_results": tool_results_list
        }, ensure_ascii=False) + "\n"
        return

    # ── Done ─────────────────────────────────────────────────────────────────
    yield json.dumps({
        "type":         "done",
        "tool_calls":   executed_tools,
        "tool_results": tool_results_list
    }, ensure_ascii=False) + "\n"
